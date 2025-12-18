import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { deleteSftpUser, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldSftpUserDeleteArgs {
  sftpUserId: string;
  confirm?: boolean;
  force?: boolean;
  quiet?: boolean;
}

export const handleSftpUserDeleteCli: MittwaldCliToolHandler<MittwaldSftpUserDeleteArgs> = async (args, sessionId) => {
  if (!args.sftpUserId) {
    return formatToolResponse(
      "error",
      "SFTP user ID is required to delete an SFTP user"
    );
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'SFTP user deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;

  logger.warn('[SftpUserDelete] Destructive operation attempted', {
    sftpUserId: args.sftpUserId,
    force: Boolean(args.force),
    sessionId: effectiveSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  try {
    await deleteSftpUser({
      sftpUserId: args.sftpUserId,
      apiToken: session.mittwaldAccessToken,
    });

    // Use library result (void for delete operations)
    if (args.quiet) {
      return formatToolResponse(
        'success',
        args.sftpUserId,
        {
          sftpUserId: args.sftpUserId,
          action: 'deleted',
          status: 'success',
        }
      );
    }

    return formatToolResponse(
      'success',
      `SFTP user ${args.sftpUserId} has been successfully deleted`,
      {
        sftpUserId: args.sftpUserId,
        action: 'deleted',
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP06] Unexpected error in sftp user delete handler', { error });
    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
