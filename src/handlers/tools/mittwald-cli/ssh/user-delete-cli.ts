import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { deleteSshUser, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldSshUserDeleteArgs {
  sshUserId: string;
  confirm?: boolean;
  force?: boolean;
  quiet?: boolean;
}

function buildSuccessPayload(args: MittwaldSshUserDeleteArgs, quiet: boolean) {
  return {
    sshUserId: args.sshUserId,
    action: 'deleted',
    ...(quiet
      ? { status: 'success' }
      : {}),
  };
}

export const handleSshUserDeleteCli: MittwaldCliToolHandler<MittwaldSshUserDeleteArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.sshUserId) {
    return formatToolResponse('error', 'SSH user ID is required to delete an SSH user');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'SSH user deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[SshUserDelete] Destructive operation attempted', {
    sshUserId: args.sshUserId,
    force: Boolean(args.force),
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  try {
    await deleteSshUser({
      sshUserId: args.sshUserId,
      apiToken: session.mittwaldAccessToken,
    });

    const successPayload = buildSuccessPayload(args, Boolean(args.quiet));

    return formatToolResponse(
      'success',
      args.quiet ? 'SSH user deleted successfully' : `SSH user ${args.sshUserId} has been successfully deleted`,
      successPayload
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP06] Unexpected error in ssh user delete handler', { error });
    return formatToolResponse('error', `Failed to delete SSH user: ${error instanceof Error ? error.message : String(error)}`);
  }
};
