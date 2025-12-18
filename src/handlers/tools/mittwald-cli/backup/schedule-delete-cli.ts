import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { deleteBackupSchedule, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldBackupScheduleDeleteCliArgs {
  backupScheduleId: string;
  confirm?: boolean;
  force?: boolean;
  quiet?: boolean;
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

  try {
    const result = await deleteBackupSchedule({
      scheduleId: args.backupScheduleId,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      `Backup schedule ${args.backupScheduleId} deleted successfully`,
      {
        backupScheduleId: args.backupScheduleId,
        deleted: true,
      },
      {
        durationMs: result.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP06] Unexpected error in backup schedule delete handler', { error });
    return formatToolResponse('error', `Failed to delete backup schedule: ${error instanceof Error ? error.message : String(error)}`);
  }
};
