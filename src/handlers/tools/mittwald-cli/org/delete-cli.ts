import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { deleteOrganization, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface OrgDeleteArgs {
  organizationId: string;
  confirm: boolean;
}

interface OrgDeletePayload {
  organizationId: string;
  deleted: boolean;
  result?: string;
}

/**
 * Handler for the `mittwald_org_delete` tool.
 */
export const handleOrgDeleteCli: MittwaldToolHandler<OrgDeleteArgs> = async (args, context) => {
  if (!args.organizationId) {
    return formatToolResponse('error', 'Parameter "organizationId" is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Organization deletion requires confirm=true. This operation is destructive and cannot be undone.'
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

  logger.warn('[OrgDelete] Attempting to delete organization', {
    organizationId: args.organizationId,
    sessionId: context?.sessionId,
    userId: context?.userId,
  });

  try {
    const result = await deleteOrganization({
      customerId: args.organizationId,
      apiToken: session.mittwaldAccessToken,
    });

    const payload: OrgDeletePayload = {
      organizationId: args.organizationId,
      deleted: true,
    };

    return formatToolResponse(
      'success',
      `Organization ${args.organizationId} deleted successfully.`,
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

    logger.error('[WP06] Unexpected error in org delete handler', { error });
    return formatToolResponse(
      'error',
      `Failed to delete organization: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
