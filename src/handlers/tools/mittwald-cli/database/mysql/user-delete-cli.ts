import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { CliToolError } from '@/tools/index.js';
import { deleteMysqlUser, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDatabaseMysqlUserDeleteArgs {
  userId: string;
  confirm?: boolean;
  force?: boolean;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldDatabaseMysqlUserDeleteArgs): string[] {
  const cliArgs: string[] = ['database', 'mysql', 'user', 'delete', args.userId];

  if (args.force) {
    cliArgs.push('--force');
  }

  if (args.quiet ?? true) {
    cliArgs.push('--quiet');
  }

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseMysqlUserDeleteArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('permission denied') || combined.includes('forbidden') || combined.includes('401')) {
    return `Permission denied while deleting MySQL user. Re-authenticate and ensure the Mittwald CLI session is valid.\nError: ${message}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    return `MySQL user not found. Verify the user ID: ${args.userId}.\nError: ${message}`;
  }

  if (combined.includes('main mysql user')) {
    return 'The primary MySQL user cannot be deleted manually. Delete the database to remove its main user.';
  }

  if (combined.includes('cancelled') || combined.includes('confirmation')) {
    return `MySQL user deletion was cancelled. Pass force=true to skip confirmation.\nError: ${message}`;
  }

  return `Failed to delete MySQL user: ${message}`;
}

export const handleDatabaseMysqlUserDeleteCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlUserDeleteArgs> = async (
  args,
  sessionId,
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.userId) {
    return formatToolResponse('error', 'User ID is required to delete a MySQL user.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'MySQL user deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[DatabaseMysqlUserDelete] Destructive operation attempted', {
    mysqlUserId: args.userId,
    force: Boolean(args.force),
    sessionId: effectiveSessionId,
  });

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_database_mysql_user_delete',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await deleteMysqlUser({
          userId: args.userId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_database_mysql_user_delete',
        userId: args.userId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_database_mysql_user_delete',
        userId: args.userId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    return formatToolResponse(
      'success',
      `Successfully deleted MySQL user ${args.userId}.`,
      {
        userId: args.userId,
        deleted: true,
      },
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

    logger.error('[WP04] Unexpected error in database mysql user delete handler', { error });
    return formatToolResponse('error', `Failed to delete MySQL user: ${error instanceof Error ? error.message : String(error)}`);
  }
};
