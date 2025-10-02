import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '../../../../../utils/cli-wrapper.js';
import { logger } from '../../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldDatabaseRedisGetArgs {
  redisId: string;
  outputFormat?: 'json' | 'yaml' | 'txt';
}

interface RedisDatabaseDetails {
  id: string;
  name?: string;
  description?: string;
  projectId?: string;
  version?: string;
  hostname?: string;
  status?: string;
  configuration?: {
    persistent?: boolean;
    maxMemory?: string | null;
    maxMemoryPolicy?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

function buildCliArgs(args: MittwaldDatabaseRedisGetArgs): string[] {
  const format = args.outputFormat ?? 'json';
  return ['database', 'redis', 'get', args.redisId, '--output', format];
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseRedisGetArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('permission denied') || combined.includes('forbidden') || combined.includes('401')) {
    return `Permission denied while retrieving Redis database. Re-authenticate and ensure the Mittwald CLI session is valid.\nError: ${message}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    return `Redis database not found. Verify the Redis ID: ${args.redisId}.\nError: ${message}`;
  }

  return `Failed to retrieve Redis database: ${message}`;
}

/**
 * Handle retrieval of Redis database details through the Mittwald CLI wrapper.
 */
export const handleDatabaseRedisGetCli: MittwaldCliToolHandler<MittwaldDatabaseRedisGetArgs> = async (
  args,
  sessionId,
) => {
  if (!args.redisId) {
    return formatToolResponse('error', 'Redis database ID is required to fetch details.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_redis_get',
      argv,
      sessionId,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const outputFormat = args.outputFormat ?? 'json';
    let details: RedisDatabaseDetails | undefined;
    let parseError: string | undefined;

    if (outputFormat === 'json') {
      try {
        const parsed = parseJsonOutput(stdout || stderr);
        if (parsed && typeof parsed === 'object') {
          details = parsed as RedisDatabaseDetails;
        } else {
          parseError = 'Unexpected JSON structure returned by Mittwald CLI.';
        }
      } catch (error) {
        parseError = error instanceof Error ? error.message : String(error);
        logger.error('[Redis Get] Failed to parse CLI output as JSON', {
          redisId: args.redisId,
          error: parseError,
          stdout,
          stderr,
        });
      }
    }

    return formatToolResponse(
      'success',
      `Retrieved Redis database ${args.redisId}.`,
      {
        redisId: args.redisId,
        format: outputFormat,
        database: details,
        rawOutput: details ? undefined : stdout || stderr || undefined,
        parseError,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
