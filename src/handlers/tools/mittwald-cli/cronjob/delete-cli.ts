import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { deleteCronjob, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldCronjobDeleteCliArgs {
  cronjobId: string;
  confirm?: boolean;
  quiet?: boolean;
  force?: boolean;
}

export const handleCronjobDeleteCli: MittwaldCliToolHandler<MittwaldCronjobDeleteCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.cronjobId) {
    return formatToolResponse('error', 'cronjobId is required');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Cronjob deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[CronjobDelete] Destructive operation attempted', {
    cronjobId: args.cronjobId,
    force: Boolean(args.force),
    sessionId: effectiveSessionId,
  });

  try {
    const result = await deleteCronjob({
      cronjobId: args.cronjobId,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      'Cronjob deleted successfully',
      {
        cronjobId: args.cronjobId,
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

    logger.error('[WP06] Unexpected error in cronjob delete handler', { error });
    return formatToolResponse('error', `Failed to delete cronjob: ${error instanceof Error ? error.message : String(error)}`);
  }
};
