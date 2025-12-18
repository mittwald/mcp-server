import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { CliToolError } from '@/tools/index.js';
import { createRedisDatabase, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';
import { buildSecureToolResponse } from '../../../../../utils/credential-response.js';

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
  quiet?: boolean;
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

  if (args.quiet ?? true) {
    cliArgs.push('--quiet');
  }

  return cliArgs;
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

export const handleDatabaseRedisCreateCli: MittwaldCliToolHandler<MittwaldDatabaseRedisCreateArgs> = async (
  args,
  sessionId,
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return buildSecureToolResponse('error', 'Session ID required');
  }

  if (!args.projectId) {
    return buildSecureToolResponse('error', 'Project ID is required to create a Redis database.');
  }

  if (!args.description) {
    return buildSecureToolResponse('error', 'Description is required to create a Redis database.');
  }

  if (!args.version) {
    return buildSecureToolResponse('error', 'Version is required to create a Redis database.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return buildSecureToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_database_redis_create',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await createRedisDatabase({
          projectId: args.projectId,
          description: args.description,
          version: args.version,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_database_redis_create',
        projectId: args.projectId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_database_redis_create',
        projectId: args.projectId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const result = validation.libraryOutput.data;

    return buildSecureToolResponse(
      'success',
      `Created Redis database in project ${args.projectId}.`,
      result,
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return buildSecureToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return buildSecureToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in database redis create handler', { error });
    return buildSecureToolResponse('error', `Failed to create Redis database: ${error instanceof Error ? error.message : String(error)}`);
  }
};
