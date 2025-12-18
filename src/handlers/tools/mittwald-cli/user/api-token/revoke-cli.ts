import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { logger } from '../../../../../utils/logger.js';
import { revokeUserApiToken, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';

interface MittwaldUserApiTokenRevokeArgs {
  tokenId: string;
  confirm?: boolean;
  force?: boolean;
  quiet?: boolean;
}

export const handleUserApiTokenRevokeCli: MittwaldCliToolHandler<MittwaldUserApiTokenRevokeArgs> = async (args, sessionId) => {
  if (!args.tokenId) {
    return formatToolResponse('error', 'Token ID is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'API token revocation requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[UserApiTokenRevoke] Destructive operation attempted', {
    tokenId: args.tokenId,
    force: Boolean(args.force),
    quiet: Boolean(args.quiet),
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  try {
    const result = await revokeUserApiToken({
      tokenId: args.tokenId,
      apiToken: session.mittwaldAccessToken,
    });

    const output = `API token ${args.tokenId} revoked successfully`;
    const successPayload = {
      tokenId: args.tokenId,
      revoked: true,
      output,
      force: args.force,
      quiet: args.quiet,
    };

    if (args.quiet) {
      return formatToolResponse(
        'success',
        output || 'API token revoked successfully',
        successPayload,
        {
          durationMs: result.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      output || `API token ${args.tokenId} revoked successfully`,
      successPayload,
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

    logger.error('[WP06] Unexpected error in user api token revoke handler', { error });
    return formatToolResponse(
      'error',
      `Failed to revoke API token: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
