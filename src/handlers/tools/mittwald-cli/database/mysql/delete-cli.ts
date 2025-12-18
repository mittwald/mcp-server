import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { CliToolError } from '../../../../../tools/index.js';
import { deleteMysqlDatabase, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDatabaseMysqlDeleteArgs {
  databaseId: string;
  confirm?: boolean;
  quiet?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldDatabaseMysqlDeleteArgs): string[] {
  const cliArgs: string[] = ['database', 'mysql', 'delete', args.databaseId];

  if (args.quiet) cliArgs.push('--quiet');
  if (args.force) cliArgs.push('--force');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseMysqlDeleteArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const defaultMessage = `Failed to delete MySQL database: ${error.stderr || error.message}`;

  if (
    combined.includes('403') ||
    combined.includes('forbidden') ||
    combined.includes('permission denied')
  ) {
    return `Permission denied when deleting MySQL database. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    return `MySQL database not found. Please verify the database ID: ${args.databaseId}\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('cancelled') || combined.includes('aborted')) {
    return `Database deletion was cancelled. Use --force flag to skip confirmation.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('in use') || combined.includes('active connections')) {
    return `Cannot delete database - it may have active connections or be in use.\nError: ${error.stderr || error.message}`;
  }

  return defaultMessage;
}

export const handleDatabaseMysqlDeleteCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlDeleteArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'MySQL database deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[DatabaseMysqlDelete] Destructive operation attempted', {
    databaseId: args.databaseId,
    force: Boolean(args.force),
    sessionId: effectiveSessionId,
  });

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_database_mysql_delete',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await deleteMysqlDatabase({
          databaseId: args.databaseId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_database_mysql_delete',
        databaseId: args.databaseId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_database_mysql_delete',
        databaseId: args.databaseId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    return formatToolResponse(
      'success',
      `Successfully deleted MySQL database '${args.databaseId}'`,
      {
        databaseId: args.databaseId,
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

    logger.error('[WP04] Unexpected error in database mysql delete handler', { error });
    return formatToolResponse('error', `Failed to delete MySQL database: ${error instanceof Error ? error.message : String(error)}`);
  }
};
