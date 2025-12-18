import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listSshUsers, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldSshUserListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function formatSshUser(record: Record<string, unknown>) {
  return {
    id: record.id,
    description: record.description,
    active: record.active,
    projectId: record.projectId,
    authentication: record.authentication,
    expiresAt: record.expiresAt,
    data: record,
  };
}

export const handleSshUserListCli: MittwaldCliToolHandler<MittwaldSshUserListArgs> = async (args, sessionId) => {
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
    const result = await listSshUsers({
      projectId: args.projectId,
      apiToken: session.mittwaldAccessToken,
    });

    const sshUsers = result.data as any[];

    if (!sshUsers || sshUsers.length === 0) {
      return formatToolResponse(
        'success',
        'No SSH users found',
        []
      );
    }

    const formatted = sshUsers.map((item) => formatSshUser((item ?? {}) as Record<string, unknown>));

    return formatToolResponse(
      'success',
      `Found ${formatted.length} SSH user(s)`,
      formatted
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    return formatToolResponse('error', `Failed to list SSH users: ${error instanceof Error ? error.message : String(error)}`);
  }
};
