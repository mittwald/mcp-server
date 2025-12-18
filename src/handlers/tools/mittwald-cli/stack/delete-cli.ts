import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { deleteStack, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldStackDeleteCliArgs {
  stackId: string;
  confirm?: boolean;
  quiet?: boolean;
  force?: boolean;
  withVolumes?: boolean;
}

export const handleStackDeleteCli: MittwaldCliToolHandler<MittwaldStackDeleteCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.stackId) {
    return formatToolResponse('error', 'stackId is required');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Stack deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[StackDelete] Destructive operation attempted', {
    stackId: args.stackId,
    force: Boolean(args.force),
    withVolumes: Boolean(args.withVolumes),
    sessionId: effectiveSessionId,
  });

  try {
    await deleteStack({
      stackId: args.stackId,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      'Stack deleted successfully',
      {
        stackId: args.stackId,
        status: 'deleted',
        withVolumes: args.withVolumes,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP06] Unexpected error in stack delete handler', { error });
    return formatToolResponse('error', `Failed to delete stack: ${error instanceof Error ? error.message : String(error)}`);
  }
};
