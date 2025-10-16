import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldBackupScheduleDeleteCliArgs {
  backupScheduleId: string;
  confirm?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldBackupScheduleDeleteCliArgs): string[] {
  const cliArgs: string[] = ['backup', 'schedule', 'delete', args.backupScheduleId];

  if (args.force) cliArgs.push('--force');

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
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;
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
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_backup_schedule_delete',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const output = result.result.stdout || result.result.stderr || '';
    const message = `Backup schedule ${args.backupScheduleId} deleted successfully`;

    return formatToolResponse(
      'success',
      message,
      {
        backupScheduleId: args.backupScheduleId,
        deleted: true,
        output,
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

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
