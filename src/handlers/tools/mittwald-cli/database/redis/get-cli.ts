import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { CliToolError } from '@/tools/index.js';
import { getRedisDatabase, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDatabaseRedisGetArgs {
  redisId: string;
  outputFormat?: 'json' | 'yaml' | 'txt';
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

export const handleDatabaseRedisGetCli: MittwaldCliToolHandler<MittwaldDatabaseRedisGetArgs> = async (
  args,
  sessionId,
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.redisId) {
    return formatToolResponse('error', 'Redis database ID is required to fetch details.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_database_redis_get',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getRedisDatabase({
          databaseId: args.redisId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_database_redis_get',
        redisId: args.redisId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_database_redis_get',
        redisId: args.redisId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const database = validation.libraryOutput.data;

    return formatToolResponse(
      'success',
      `Retrieved Redis database ${args.redisId}.`,
      database,
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
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in database redis get handler', { error });
    return formatToolResponse('error', `Failed to retrieve Redis database: ${error instanceof Error ? error.message : String(error)}`);
  }
};
