import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { buildSecureToolResponse } from '../../../../../utils/credential-response.js';
import { createUserApiToken, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserApiTokenCreateArgs {
  description: string;
  roles: ('api_read' | 'api_write')[];
  quiet?: boolean;
  expires?: string;
}

export const handleUserApiTokenCreateCli: MittwaldCliToolHandler<MittwaldUserApiTokenCreateArgs> = async (
  args,
  sessionId,
) => {
  if (!args.description) {
    return buildSecureToolResponse('error', 'Description is required to create an API token.');
  }

  if (!Array.isArray(args.roles) || args.roles.length === 0) {
    return buildSecureToolResponse('error', 'At least one role must be specified to create an API token.');
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return buildSecureToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return buildSecureToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await createUserApiToken({
      description: args.description,
      roles: args.roles,
      expiresAt: args.expires,
      apiToken: session.mittwaldAccessToken,
    });

    const token = result.data?.token;

    if (!token) {
      return buildSecureToolResponse(
        'error',
        'Failed to create API token - no token returned.',
        {
          result: result.data,
        },
        {
          durationMs: result.durationMs,
        }
      );
    }

    const data = {
      description: args.description,
      roles: args.roles,
      expires: args.expires,
      generatedToken: token,
      tokenGenerated: true,
    };

    const message = args.quiet ? token : 'API token created successfully';

    return buildSecureToolResponse(
      'success',
      message,
      data,
      {
        durationMs: result.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return buildSecureToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP06] Unexpected error in user api token create handler', { error });
    return buildSecureToolResponse(
      'error',
      `Failed to create API token: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
