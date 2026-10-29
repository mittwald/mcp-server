import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { LibraryError, orderDomain } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';
import { takePendingDomainOrder } from '../../../../utils/pending-domain-orders.js';
import { requestUserConfirmation } from '../../../../utils/user-confirmation.js';
import { buildDomainOrderOverview, formatDomainOrderOverview, verificationEmailNotice } from './domain-order-overview.js';

interface MittwaldDomainOrderArgs {
  confirmationToken: string;
}

export const handleDomainOrderCli: MittwaldCliToolHandler<MittwaldDomainOrderArgs> = async (args, sessionId) => {
  if (!args.confirmationToken) {
    return formatToolResponse('error', 'confirmationToken is required. Call mittwald_domain_order_preview first.');
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const order = await takePendingDomainOrder(args.confirmationToken, session.userId);
  if (!order) {
    return formatToolResponse(
      'error',
      'Unknown or expired confirmationToken. Nothing was ordered; call mittwald_domain_order_preview again.'
    );
  }

  const confirmation = await requestUserConfirmation(
    formatDomainOrderOverview(order),
    `Order ${order.domain} for ${buildDomainOrderOverview(order).price.total}`
  );
  if (confirmation.outcome === 'rejected') {
    return formatToolResponse(
      'error',
      `The domain was NOT ordered. ${confirmation.reason} To try again, call mittwald_domain_order_preview again.`
    );
  }

  try {
    const result = await orderDomain({
      domain: order.domain,
      projectId: order.projectId,
      authCode: order.authCode,
      ownerHandle: order.ownerHandle,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      `Ordered ${order.domain}. Tell the user: ${verificationEmailNotice(order.tld)} If the email does not arrive, use ` +
        `mittwald_domain_resend_verification once the domain shows up in mittwald_domain_list.`,
      {
        orderId: result.data.orderId,
        overview: buildDomainOrderOverview(order),
        confirmedVia: confirmation.outcome === 'confirmed' ? 'elicitation' : 'agent',
      },
      {
        durationMs: result.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      const scopeHint = error.code === 403 ? ' (this requires the OAuth scope order:domain-create)' : '';
      return formatToolResponse('error', `The domain was NOT ordered: ${error.message}${scopeHint}`, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('Unexpected error in domain order handler', { error });
    return formatToolResponse('error', `Failed to order domain: ${error instanceof Error ? error.message : String(error)}`);
  }
};
