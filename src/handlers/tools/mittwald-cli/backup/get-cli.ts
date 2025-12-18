import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getBackup, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldBackupGetCliArgs {
  backupId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function formatBackupDetails(data: Record<string, unknown>) {
  return {
    id: data.id,
    projectId: data.projectId,
    description: data.description ?? 'No description',
    status: data.status,
    createdAt: data.createdAt,
    expiresAt: data.expiresAt,
    size: data.size ?? 'Unknown',
    format: data.format ?? 'Unknown',
  };
}

export const handleBackupGetCli: MittwaldCliToolHandler<MittwaldBackupGetCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.backupId) {
    return formatToolResponse('error', 'Backup ID is required. Please provide the backupId parameter.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await getBackup({
      backupId: args.backupId,
      apiToken: session.mittwaldAccessToken,
    });

    const backup = result.data as Record<string, unknown>;

    return formatToolResponse(
      'success',
      `Retrieved backup details for ${args.backupId}`,
      formatBackupDetails(backup),
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

    logger.error('[WP06] Unexpected error in backup get handler', { error });
    return formatToolResponse('error', `Failed to get backup: ${error instanceof Error ? error.message : String(error)}`);
  }
};
