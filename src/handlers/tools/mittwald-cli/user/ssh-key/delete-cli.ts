import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { logger } from '../../../../../utils/logger.js';
import { deleteUserSshKey, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';

interface MittwaldUserSshKeyDeleteArgs {
  keyId: string;
  confirm?: boolean;
  force?: boolean;
  quiet?: boolean;
}

export const handleUserSshKeyDeleteCli: MittwaldCliToolHandler<MittwaldUserSshKeyDeleteArgs> = async (args, sessionId) => {
  if (!args.keyId || !args.keyId.trim()) {
    return formatToolResponse('error', 'SSH key ID is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'SSH key deletion requires confirm=true. This operation is destructive and cannot be undone.'
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

  logger.warn('[UserSshKeyDelete] Destructive operation attempted', {
    keyId: args.keyId,
    force: Boolean(args.force),
    quiet: Boolean(args.quiet),
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  try {
    const result = await deleteUserSshKey({
      sshKeyId: args.keyId,
      apiToken: session.mittwaldAccessToken,
    });

    const output = `SSH key ${args.keyId} deleted successfully`;
    const successPayload = {
      keyId: args.keyId,
      deleted: true,
      output,
      force: args.force,
      quiet: args.quiet,
    };

    if (args.quiet) {
      return formatToolResponse(
        'success',
        output || 'SSH key deleted successfully',
        successPayload,
        {
          durationMs: result.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      output || `SSH key ${args.keyId} deleted successfully`,
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

    logger.error('[WP06] Unexpected error in user ssh key delete handler', { error });
    return formatToolResponse(
      'error',
      `Failed to delete SSH key: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
