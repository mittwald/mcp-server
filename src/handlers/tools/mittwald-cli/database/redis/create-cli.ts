import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { buildSecureToolResponse } from '../../../../../utils/credential-response.js';
import { parseJsonOutput, parseQuietOutput } from '@/utils/cli-output.js';
import { logger } from '../../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '@/tools/index.js';

interface MittwaldDatabaseRedisCreateArgs {
  projectId: string;
  description: string;
  version: string;
  persistent?: boolean;
  maxMemory?: string;
  maxMemoryPolicy?:
    | 'noeviction'
    | 'allkeys-lru'
    | 'allkeys-lfu'
    | 'volatile-lru'
    | 'volatile-lfu'
    | 'allkeys-random'
    | 'volatile-random'
    | 'volatile-ttl';
}

interface RedisDatabaseDetails {
  id: string;
  name?: string;
  description?: string;
  projectId?: string;
  version?: string;
  hostname?: string;
  configuration?: {
    persistent?: boolean;
    maxMemory?: string | null;
    maxMemoryPolicy?: string | null;
  };
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

function buildCliArgs(args: MittwaldDatabaseRedisCreateArgs): string[] {
  const cliArgs: string[] = [
    'database',
    'redis',
    'create',
    '--project-id',
    args.projectId,
    '--description',
    args.description,
    '--version',
    args.version,
  ];

  const persistent = args.persistent ?? true;
  if (persistent) {
    cliArgs.push('--persistent');
  } else {
    cliArgs.push('--no-persistent');
  }

  if (args.maxMemory) {
    cliArgs.push('--max-memory', args.maxMemory);
  }

  if (args.maxMemoryPolicy) {
    cliArgs.push('--max-memory-policy', args.maxMemoryPolicy);
  }

  return cliArgs;
}

function parseRedisCreateOutput(stdout: string, stderr: string): string | undefined {
  const identifier = parseQuietOutput(stdout) ?? parseQuietOutput(stderr);
  if (identifier) {
    return identifier;
  }

  const combined = `${stdout}\n${stderr}`;
  const match = combined.match(/(redis-[a-z0-9]+|[a-f0-9-]{8,})/i);
  if (match) {
    return match[1];
  }

  logger.error('[Redis Create] Unable to determine Redis database ID from CLI output', {
    stdout,
    stderr,
  });
  return undefined;
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseRedisCreateArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('permission denied') || combined.includes('forbidden') || combined.includes('401')) {
    return `Permission denied while creating Redis database. Re-authenticate and ensure the Mittwald CLI session is valid.\nError: ${message}`;
  }

  if (combined.includes('project') && combined.includes('not found')) {
    return `Project not found. Verify the project ID: ${args.projectId}.\nError: ${message}`;
  }

  if (combined.includes('version') && combined.includes('not supported')) {
    return `Redis version '${args.version}' is not supported. Use the redis versions tool to list available versions.\nError: ${message}`;
  }

  if (combined.includes('max-memory') && combined.includes('invalid')) {
    return `Invalid max memory value '${args.maxMemory ?? ''}'. Provide a numeric value with IEC suffix (e.g. 512Mi).\nError: ${message}`;
  }

  return `Failed to create Redis database: ${message}`;
}

async function fetchRedisDatabaseDetails(
  redisId: string,
  sessionId?: string,
): Promise<RedisDatabaseDetails | undefined> {
  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_redis_get',
      argv: ['database', 'redis', 'get', redisId, '--output', 'json'],
      sessionId,
      parser: (stdout) => stdout,
    });

    const parsed = parseJsonOutput(result.result);
    if (!parsed || typeof parsed !== 'object') {
      logger.warn('[Redis Create] Unexpected structure for Redis database details', { parsed });
      return undefined;
    }

    return parsed as RedisDatabaseDetails;
  } catch (error) {
    logger.warn('[Redis Create] Failed to fetch newly created Redis database details', {
      redisId,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

/**
 * Handle Redis database creation via the Mittwald CLI wrapper.
 */
export const handleDatabaseRedisCreateCli: MittwaldCliToolHandler<MittwaldDatabaseRedisCreateArgs> = async (
  args,
  sessionId,
) => {
  if (!args.projectId) {
    return buildSecureToolResponse('error', 'Project ID is required to create a Redis database.');
  }

  if (!args.description) {
    return buildSecureToolResponse('error', 'Description is required to create a Redis database.');
  }

  if (!args.version) {
    return buildSecureToolResponse('error', 'Version is required to create a Redis database.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_redis_create',
      argv,
      sessionId,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const redisId = parseRedisCreateOutput(stdout, stderr);

    if (!redisId) {
      return buildSecureToolResponse(
        'error',
        'Redis database created but the CLI did not return an identifier.',
        {
          output: stdout || stderr,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const details = await fetchRedisDatabaseDetails(redisId, sessionId);
    const persistent = args.persistent ?? true;

    const responseData = {
      redisId,
      projectId: args.projectId,
      description: args.description,
      version: args.version,
      persistent,
      maxMemory: args.maxMemory,
      maxMemoryPolicy: args.maxMemoryPolicy,
      details,
    };

    const messageParts = [`Created Redis database ${redisId} in project ${args.projectId}.`];
    if (!persistent) {
      messageParts.push('Persistent storage disabled.');
    }
    if (!details) {
      messageParts.push('Unable to retrieve full database details after creation.');
    }

    return buildSecureToolResponse(
      'success',
      messageParts.join(' '),
      responseData,
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return buildSecureToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return buildSecureToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
