import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { createBackupSchedule, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldBackupScheduleCreateCliArgs {
  projectId?: string;
  schedule: string;
  ttl: string;
  description?: string;
  quiet?: boolean;
}

function buildSuccessPayload(args: MittwaldBackupScheduleCreateCliArgs, output: string, scheduleId?: string) {
  return {
    scheduleId,
    projectId: args.projectId,
    schedule: args.schedule,
    ttl: args.ttl,
    description: args.description,
    output,
  };
}

export const handleBackupScheduleCreateCli: MittwaldCliToolHandler<MittwaldBackupScheduleCreateCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  if (!args.schedule) {
    return formatToolResponse('error', "'schedule' is required. Please provide the schedule parameter.");
  }

  if (!args.ttl) {
    return formatToolResponse('error', "'ttl' is required. Please provide the ttl parameter.");
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await createBackupSchedule({
      projectId: args.projectId!,
      schedule: args.schedule,
      ttl: args.ttl,
      description: args.description,
      apiToken: session.mittwaldAccessToken,
    });

    const schedule = result.data as any;

    return formatToolResponse(
      'success',
      'Backup schedule created successfully',
      {
        scheduleId: schedule?.id,
        projectId: args.projectId,
        schedule: args.schedule,
        ttl: args.ttl,
        description: args.description,
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

    logger.error('[WP06] Unexpected error in backup schedule create handler', { error });
    return formatToolResponse('error', `Failed to create backup schedule: ${error instanceof Error ? error.message : String(error)}`);
  }
};
