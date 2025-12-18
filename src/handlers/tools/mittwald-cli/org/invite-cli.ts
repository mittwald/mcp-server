import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { inviteToOrg, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface OrgInviteArgs {
  organizationId: string;
  email: string;
  role: 'owner' | 'member' | 'accountant';
  message?: string;
  expires?: string;
}

interface OrgInvitePayload {
  organizationId: string;
  email: string;
  role: string;
  inviteId?: string;
  expires?: string;
  message?: string;
}

/**
 * Handler for the `mittwald_org_invite` tool.
 */
export const handleOrgInviteCli: MittwaldToolHandler<OrgInviteArgs> = async (args, context) => {
  if (!args.organizationId) {
    return formatToolResponse('error', 'Parameter "organizationId" is required.');
  }

  if (!args.email) {
    return formatToolResponse('error', 'Parameter "email" is required.');
  }

  if (!args.role) {
    return formatToolResponse('error', 'Parameter "role" is required.');
  }

  const effectiveSessionId = context?.sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await inviteToOrg({
      customerId: args.organizationId,
      email: args.email,
      role: args.role,
      apiToken: session.mittwaldAccessToken,
    });

    const inviteData = result.data as any;

    const payload: OrgInvitePayload = {
      organizationId: args.organizationId,
      email: args.email,
      role: args.role,
      inviteId: inviteData?.id,
      expires: args.expires,
      message: args.message,
    };

    return formatToolResponse(
      'success',
      `Invitation sent to ${args.email} for organization ${args.organizationId}.`,
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

    logger.error('[WP06] Unexpected error in org invite handler', { error });
    return formatToolResponse(
      'error',
      `Failed to send organization invite: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
