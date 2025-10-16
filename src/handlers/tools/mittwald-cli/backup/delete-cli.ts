import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldBackupDeleteCliArgs {
  backupId: string;
  confirm?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldBackupDeleteCliArgs): string[] {
  const cliArgs: string[] = ['backup', 'delete', args.backupId];

  if (args.force) cliArgs.push('--force');

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
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;
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
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_backup_delete',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const output = result.result.stdout || result.result.stderr || '';
    const message = `Backup ${args.backupId} deleted successfully`;

    return formatToolResponse(
      'success',
      message || `Backup ${args.backupId} deleted successfully`,
      {
        backupId: args.backupId,
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
