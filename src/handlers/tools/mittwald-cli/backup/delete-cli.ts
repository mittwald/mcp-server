import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { deleteBackup, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldBackupDeleteCliArgs {
  backupId: string;
  confirm?: boolean;
  force?: boolean;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldBackupDeleteCliArgs): string[] {
  const cliArgs: string[] = ['backup', 'delete', args.backupId];

  if (args.force) cliArgs.push('--force');
  if (args.quiet) cliArgs.push('--quiet');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldBackupDeleteCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('backup')) {
    return `Backup not found. Please verify the backup ID: ${args.backupId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('cancelled') || combined.includes('confirmation')) {
    return `Backup deletion cancelled. Use --force flag to skip confirmation.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleBackupDeleteCli: MittwaldCliToolHandler<MittwaldBackupDeleteCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.backupId) {
    return formatToolResponse('error', 'Backup ID is required. Please provide the backupId parameter.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Backup deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  logger.warn('[BackupDelete] Destructive operation attempted', {
    backupId: args.backupId,
    force: Boolean(args.force),
    sessionId: effectiveSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_backup_delete',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await deleteBackup({
          backupId: args.backupId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_backup_delete',
        backupId: args.backupId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_backup_delete',
        backupId: args.backupId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    return formatToolResponse(
      'success',
      `Backup ${args.backupId} deleted successfully`,
      {
        backupId: args.backupId,
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

    logger.error('[WP05] Unexpected error in backup delete handler', { error });
    return formatToolResponse('error', `Failed to delete backup: ${error instanceof Error ? error.message : String(error)}`);
  }
};
