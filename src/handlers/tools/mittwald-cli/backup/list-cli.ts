import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listBackups, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldBackupListCliArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

type RawBackup = {
  id?: string;
  projectId?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  expiresAt?: string;
  size?: string | number;
};

function formatBackups(backups: RawBackup[]) {
  return backups.map((item) => ({
    id: item.id,
    projectId: item.projectId,
    description: item.description ?? 'No description',
    status: item.status,
    createdAt: item.createdAt,
    expiresAt: item.expiresAt,
    size: item.size ?? 'Unknown',
  }));
}

export const handleBackupListCli: MittwaldCliToolHandler<MittwaldBackupListCliArgs> = async (args, sessionId) => {
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
    const result = await listBackups({
      projectId: args.projectId!,
      apiToken: session.mittwaldAccessToken,
    });

    const backups = result.data as any[];

    if (!backups || backups.length === 0) {
      return formatToolResponse(
        'success',
        'No backups found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Found ${backups.length} backup(s)`,
      formatBackups(backups),
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

    logger.error('[WP06] Unexpected error in backup list handler', { error });
    return formatToolResponse('error', `Failed to list backups: ${error instanceof Error ? error.message : String(error)}`);
  }
};
