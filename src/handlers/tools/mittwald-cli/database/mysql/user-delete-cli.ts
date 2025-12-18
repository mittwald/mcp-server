import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { deleteMysqlUser, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDatabaseMysqlUserDeleteArgs {
  userId: string;
  confirm?: boolean;
  force?: boolean;
  quiet?: boolean;
}

export const handleDatabaseMysqlUserDeleteCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlUserDeleteArgs> = async (
  args,
  sessionId,
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.userId) {
    return formatToolResponse('error', 'User ID is required to delete a MySQL user.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'MySQL user deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[DatabaseMysqlUserDelete] Destructive operation attempted', {
    mysqlUserId: args.userId,
    force: Boolean(args.force),
    sessionId: effectiveSessionId,
  });

  try {
    const result = await deleteMysqlUser({
      userId: args.userId,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      `Successfully deleted MySQL user ${args.userId}.`,
      {
        userId: args.userId,
        deleted: true,
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

    logger.error('[WP06] Unexpected error in database mysql user delete handler', { error });
    return formatToolResponse('error', `Failed to delete MySQL user: ${error instanceof Error ? error.message : String(error)}`);
  }
};
