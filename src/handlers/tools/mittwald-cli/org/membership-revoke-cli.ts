import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { revokeOrgMembership, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface OrgMembershipRevokeArgs {
  membershipId: string;
  organizationId?: string;
  confirm?: boolean;
}

interface OrgMembershipRevokePayload {
  membershipId: string;
  organizationId?: string;
  revoked: boolean;
  result?: string;
}

/**
 * Handler for the `mittwald_org_membership_revoke` tool.
 */
export const handleOrgMembershipRevokeCli: MittwaldToolHandler<OrgMembershipRevokeArgs> = async (args, context) => {
  if (!args.membershipId) {
    return formatToolResponse('error', 'Parameter "membershipId" is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Membership revocation requires confirm=true. This operation is destructive and cannot be undone.'
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

  logger.warn('[OrgMembershipRevoke] Attempting to revoke membership', {
    membershipId: args.membershipId,
    organizationId: args.organizationId,
    sessionId: context?.sessionId,
    userId: context?.userId,
  });

  try {
    const result = await revokeOrgMembership({
      membershipId: args.membershipId,
      apiToken: session.mittwaldAccessToken,
    });

    const payload: OrgMembershipRevokePayload = {
      membershipId: args.membershipId,
      organizationId: args.organizationId,
      revoked: true,
    };

    return formatToolResponse(
      'success',
      `Membership ${args.membershipId} revoked successfully.`,
      payload,
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

    logger.error('[WP06] Unexpected error in org membership revoke handler', { error });
    return formatToolResponse(
      'error',
      `Failed to revoke organization membership: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
