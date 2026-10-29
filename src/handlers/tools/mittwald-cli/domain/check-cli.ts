import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { checkDomain, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldDomainCheckArgs {
  domain: string;
  authCode?: string;
}

export const handleDomainCheckCli: MittwaldCliToolHandler<MittwaldDomainCheckArgs> = async (args, sessionId) => {
  if (!args.domain) {
    return formatToolResponse('error', 'Domain is required.');
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
    const result = await checkDomain({
      domain: args.domain,
      authCode: args.authCode,
      apiToken: session.mittwaldAccessToken,
    });

    const check = result.data;
    let message: string;
    if (check.registrable) {
      message = `${check.domain} is available for registration${check.isPremium ? ' (premium domain)' : ''}.`;
    } else if (check.transfer?.transferable) {
      message = check.transfer.authCodeRequired
        ? `${check.domain} is already registered. It can be transferred to mittwald with an auth code from its current registrar.`
        : `${check.domain} is already registered, but can be transferred to mittwald with the given auth code.`;
    } else {
      message = `${check.domain} is already registered and cannot be transferred (${check.transfer?.blockers.join(', ')}).`;
    }

    return formatToolResponse('success', message, check, {
      durationMs: result.durationMs,
    });
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('Unexpected error in domain check handler', { error });
    return formatToolResponse('error', `Failed to check domain: ${error instanceof Error ? error.message : String(error)}`);
  }
};
