import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { deleteBackupSchedule, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldBackupScheduleDeleteCliArgs {
  backupScheduleId: string;
  confirm?: boolean;
  force?: boolean;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldBackupScheduleDeleteCliArgs): string[] {
  const cliArgs: string[] = ['backup', 'schedule', 'delete', args.backupScheduleId];

  if (args.force) cliArgs.push('--force');
  if (args.quiet) cliArgs.push('--quiet');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldBackupScheduleDeleteCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('schedule')) {
    return `Backup schedule not found. Please verify the schedule ID: ${args.backupScheduleId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('cancelled') || combined.includes('confirmation')) {
    return `Backup schedule deletion cancelled. Use --force flag to skip confirmation.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleBackupScheduleDeleteCli: MittwaldCliToolHandler<MittwaldBackupScheduleDeleteCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.backupScheduleId) {
    return formatToolResponse('error', 'Backup schedule ID is required. Please provide the backupScheduleId parameter.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Backup schedule deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  logger.warn('[BackupScheduleDelete] Destructive operation attempted', {
    backupScheduleId: args.backupScheduleId,
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
      toolName: 'mittwald_backup_schedule_delete',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await deleteBackupSchedule({
          scheduleId: args.backupScheduleId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_backup_schedule_delete',
        backupScheduleId: args.backupScheduleId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_backup_schedule_delete',
        backupScheduleId: args.backupScheduleId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    return formatToolResponse(
      'success',
      `Backup schedule ${args.backupScheduleId} deleted successfully`,
      {
        backupScheduleId: args.backupScheduleId,
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

    logger.error('[WP05] Unexpected error in backup schedule delete handler', { error });
    return formatToolResponse('error', `Failed to delete backup schedule: ${error instanceof Error ? error.message : String(error)}`);
  }
};
