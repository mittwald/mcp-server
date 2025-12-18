import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { revokeOrgInvite, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

export interface MittwaldOrgInviteRevokeArgs {
  inviteId: string;
  confirm?: boolean;
  quiet?: boolean;
}

export const handleOrgInviteRevokeCli: MittwaldToolHandler<MittwaldOrgInviteRevokeArgs> = async (args, context) => {
  if (!args.inviteId) {
    return formatToolResponse('error', 'Invite ID is required for revoking an organization invitation.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Organization invite revocation requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const effectiveSessionId = context?.sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[OrgInviteRevoke] Destructive operation attempted', {
    inviteId: args.inviteId,
    sessionId: context?.sessionId,
    userId: context?.userId,
  });

  try {
    const result = await revokeOrgInvite({
      inviteId: args.inviteId,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      `Organization invite ${args.inviteId} revoked successfully`,
      {
        inviteId: args.inviteId,
        revoked: true,
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

    logger.error('[WP06] Unexpected error in org invite revoke handler', { error });
    return formatToolResponse('error', `Failed to revoke organization invite: ${error instanceof Error ? error.message : String(error)}`);
  }
};
