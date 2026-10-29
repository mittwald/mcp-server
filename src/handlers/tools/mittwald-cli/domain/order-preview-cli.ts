import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { buildDomainOwnerHandle, LibraryError, previewDomainOrder } from '@mittwald-mcp/cli-core';
import type { DomainOwner } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';
import { PENDING_DOMAIN_ORDER_TTL_SECONDS, storePendingDomainOrder } from '../../../../utils/pending-domain-orders.js';
import { buildDomainOrderOverview } from './domain-order-overview.js';

interface MittwaldDomainOrderPreviewArgs {
  domain: string;
  projectId: string;
  owner: DomainOwner;
  authCode?: string;
}

export const handleDomainOrderPreviewCli: MittwaldCliToolHandler<MittwaldDomainOrderPreviewArgs> = async (args, sessionId) => {
  if (!args.domain || !args.projectId || !args.owner) {
    return formatToolResponse('error', 'domain, projectId and owner are required.');
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
    const ownerHandle = await buildDomainOwnerHandle({
      domain: args.domain,
      owner: args.owner,
      apiToken: session.mittwaldAccessToken,
    });
    const preview = await previewDomainOrder({
      domain: args.domain,
      projectId: args.projectId,
      authCode: args.authCode,
      apiToken: session.mittwaldAccessToken,
    });

    const order = {
      domain: args.domain.trim().toLowerCase(),
      projectId: args.projectId,
      ...(args.authCode ? { authCode: args.authCode } : {}),
      owner: args.owner,
      price: preview.data,
    };
    const confirmationToken = await storePendingDomainOrder({
      ...order,
      userId: session.userId,
      ownerHandle: ownerHandle.data,
    });

    return formatToolResponse(
      'success',
      `Nothing has been ordered yet. Show this overview to the user, including price and the verification email ` +
        `notice, and ask for explicit approval. Only after the user approved, call mittwald_domain_order with the ` +
        `confirmationToken (valid for ${PENDING_DOMAIN_ORDER_TTL_SECONDS / 60} minutes).`,
      {
        overview: buildDomainOrderOverview(order),
        confirmationToken,
      },
      {
        durationMs: ownerHandle.durationMs + preview.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      const scopeHint = error.code === 403 ? ' (this requires the OAuth scope order:domain-preview)' : '';
      return formatToolResponse('error', `${error.message}${scopeHint}`, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('Unexpected error in domain order preview handler', { error });
    return formatToolResponse('error', `Failed to preview domain order: ${error instanceof Error ? error.message : String(error)}`);
  }
};
