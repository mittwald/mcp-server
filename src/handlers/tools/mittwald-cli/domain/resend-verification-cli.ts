import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { LibraryError, resendDomainVerificationEmail } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldDomainResendVerificationArgs {
  domainId: string;
}

export const handleDomainResendVerificationCli: MittwaldCliToolHandler<MittwaldDomainResendVerificationArgs> = async (
  args,
  sessionId
) => {
  if (!args.domainId) {
    return formatToolResponse('error', 'Domain ID is required.');
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
    const result = await resendDomainVerificationEmail({
      domainId: args.domainId,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      'Verification email resent to the domain owner. It must be confirmed within 7 days for .de domains, ' +
        'otherwise within the deadline stated in the email; if not, the domain will be blocked.',
      { domainId: args.domainId },
      { durationMs: result.durationMs }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('Unexpected error in domain resend verification handler', { error });
    return formatToolResponse('error', `Failed to resend verification email: ${error instanceof Error ? error.message : String(error)}`);
  }
};
