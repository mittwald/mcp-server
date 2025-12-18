import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { updateBackupSchedule, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldBackupScheduleUpdateCliArgs {
  backupScheduleId: string;
  description?: string;
  schedule?: string;
  ttl?: string;
  quiet?: boolean;
}

export const handleBackupScheduleUpdateCli: MittwaldCliToolHandler<MittwaldBackupScheduleUpdateCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.backupScheduleId) {
    return formatToolResponse('error', 'Backup schedule ID is required. Please provide the backupScheduleId parameter.');
  }

  if (!args.description && !args.schedule && !args.ttl) {
    return formatToolResponse('error', 'At least one field (description, schedule, ttl) must be provided to update.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await updateBackupSchedule({
      scheduleId: args.backupScheduleId,
      schedule: args.schedule,
      ttl: args.ttl,
      description: args.description,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      `Backup schedule ${args.backupScheduleId} updated successfully`,
      {
        backupScheduleId: args.backupScheduleId,
        description: args.description,
        schedule: args.schedule,
        ttl: args.ttl,
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

    logger.error('[WP06] Unexpected error in backup schedule update handler', { error });
    return formatToolResponse('error', `Failed to update backup schedule: ${error instanceof Error ? error.message : String(error)}`);
  }
};
