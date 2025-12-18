import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listBackupSchedules, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldBackupScheduleListCliArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

type RawSchedule = {
  id?: string;
  projectId?: string;
  description?: string;
  schedule?: string;
  retention?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

function formatSchedules(schedules: RawSchedule[]) {
  return schedules.map((item) => ({
    id: item.id,
    projectId: item.projectId,
    description: item.description ?? 'No description',
    schedule: item.schedule,
    retention: item.retention,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

export const handleBackupScheduleListCli: MittwaldCliToolHandler<MittwaldBackupScheduleListCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listBackupSchedules({
      projectId: args.projectId!,
      apiToken: session.mittwaldAccessToken,
    });

    const schedules = result.data as any[];

    if (!schedules || schedules.length === 0) {
      return formatToolResponse(
        'success',
        'No backup schedules found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Found ${schedules.length} backup schedule(s)`,
      formatSchedules(schedules),
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

    logger.error('[WP06] Unexpected error in backup schedule list handler', { error });
    return formatToolResponse('error', `Failed to list backup schedules: ${error instanceof Error ? error.message : String(error)}`);
  }
};
