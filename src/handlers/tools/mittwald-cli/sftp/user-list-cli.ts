import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listSftpUsers, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldSftpUserListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function formatSftpUser(record: Record<string, unknown>) {
  return {
    id: record.id,
    description: record.description,
    accessLevel: record.accessLevel,
    projectId: record.projectId,
    directories: record.directories,
    expiresAt: record.expiresAt,
    active: record.active,
    data: record,
  };
}

export const handleSftpUserListCli: MittwaldCliToolHandler<MittwaldSftpUserListArgs> = async (args, sessionId) => {
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
    const result = await listSftpUsers({
      projectId: args.projectId!,
      apiToken: session.mittwaldAccessToken,
    });

    const sftpUsers = result.data as any[];

    if (!sftpUsers || sftpUsers.length === 0) {
      return formatToolResponse(
        'success',
        'No SFTP users found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    const formatted = sftpUsers.map((item) => formatSftpUser((item ?? {}) as Record<string, unknown>));

    return formatToolResponse(
      'success',
      `Found ${formatted.length} SFTP user(s)`,
      formatted,
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

    return formatToolResponse('error', `Failed to list SFTP users: ${error instanceof Error ? error.message : String(error)}`);
  }
};
