import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getProjectInvite, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

export interface MittwaldProjectInviteGetArgs {
  inviteId: string;
  output?: 'json' | 'table' | 'yaml';
}

export const handleProjectInviteGetCli: MittwaldCliToolHandler<MittwaldProjectInviteGetArgs> = async (args, sessionId) => {
  if (!args.inviteId) {
    return formatToolResponse('error', 'Invite ID is required.');
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
    const result = await getProjectInvite({
      inviteId: args.inviteId,
      apiToken: session.mittwaldAccessToken,
    });

    const data = result.data as any;

    const formattedData = {
      id: data.id,
      email: data.mailAddress || data.email,
      role: data.projectRole || data.role,
      status: data.expired ? 'expired' : 'active',
      createdAt: data.createdAt,
      expiresAt: data.membershipExpiresAt || data.expiresAt || 'Never',
      projectId: data.projectId,
      userId: data.userId,
      invitedBy: data.invitedBy || data.inviter,
      message: data.message,
    };

    return formatToolResponse(
      'success',
      'Project invite retrieved successfully',
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

    logger.error('[WP06] Unexpected error in project invite get handler', { error });
    return formatToolResponse('error', `Failed to get project invite: ${error instanceof Error ? error.message : String(error)}`);
  }
};
