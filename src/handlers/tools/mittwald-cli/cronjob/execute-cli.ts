import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCronjob, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCronjobExecuteCliArgs {
  cronjobId: string;
  quiet?: boolean;
}

export const handleCronjobExecuteCli: MittwaldCliToolHandler<MittwaldCronjobExecuteCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.cronjobId) {
    return formatToolResponse('error', 'cronjobId is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await executeCronjob({
      cronjobId: args.cronjobId,
      apiToken: session.mittwaldAccessToken,
    });

    const executionId = result.data?.id || result.data;

    return formatToolResponse(
      'success',
      'Cronjob execution started',
      {
        cronjobId: args.cronjobId,
        executionId,
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

    logger.error('[WP06] Unexpected error in cronjob execute handler', { error });
    return formatToolResponse('error', `Failed to execute cronjob: ${error instanceof Error ? error.message : String(error)}`);
  }
};
