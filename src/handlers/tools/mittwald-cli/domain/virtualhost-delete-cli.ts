import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { deleteVirtualHost, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldDomainVirtualhostDeleteArgs {
  virtualhostId: string;
  confirm?: boolean;
  force?: boolean;
}

export const handleDomainVirtualhostDeleteCli: MittwaldCliToolHandler<MittwaldDomainVirtualhostDeleteArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;

  if (!args.virtualhostId) {
    return formatToolResponse('error', 'Virtual host ID is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Virtual host deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[DomainVirtualhostDelete] Destructive operation attempted', {
    virtualhostId: args.virtualhostId,
    force: Boolean(args.force),
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  try {
    const result = await deleteVirtualHost({
      ingressId: args.virtualhostId,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      `Successfully deleted virtual host ${args.virtualhostId}`,
      {
        deletedId: args.virtualhostId,
        force: args.force ?? false,
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

    logger.error('[WP06] Unexpected error in virtualhost delete handler', { error });
    return formatToolResponse('error', `Failed to delete virtual host: ${error instanceof Error ? error.message : String(error)}`);
  }
};
