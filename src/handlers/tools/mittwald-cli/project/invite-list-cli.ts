import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listProjectInvites, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

export interface MittwaldProjectInviteListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleProjectInviteListCli: MittwaldCliToolHandler<MittwaldProjectInviteListArgs> = async (args, sessionId) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listProjectInvites({
      projectId: args.projectId!,
      apiToken: session.mittwaldAccessToken,
    });

    const invites = result.data as any[];

    if (!invites || invites.length === 0) {
      return formatToolResponse(
        'success',
        'No project invites found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    const formattedData = invites.map((item: any) => ({
      id: item.id,
      email: item.mailAddress || item.email,
      role: item.projectRole || item.role,
      status: item.expired ? 'expired' : 'active',
      createdAt: item.createdAt,
      expiresAt: item.membershipExpiresAt || item.expiresAt || 'Never',
      projectId: item.projectId,
      userId: item.userId,
    }));

    return formatToolResponse(
      'success',
      `Found ${invites.length} project invite(s)`,
      formattedData,
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

    logger.error('[WP06] Unexpected error in project invite list handler', { error });
    return formatToolResponse('error', `Failed to list project invites: ${error instanceof Error ? error.message : String(error)}`);
  }
};
