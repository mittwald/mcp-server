import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { abortCronjobExecution, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCronjobExecutionAbortCliArgs {
  cronjobId: string;
  executionId: string;
  quiet?: boolean;
}

export const handleCronjobExecutionAbortCli: MittwaldCliToolHandler<MittwaldCronjobExecutionAbortCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.cronjobId) {
    return formatToolResponse('error', 'cronjobId is required');
  }

  if (!args.executionId) {
    return formatToolResponse('error', 'executionId is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await abortCronjobExecution({
      cronjobId: args.cronjobId,
      executionId: args.executionId,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      'Cronjob execution aborted successfully',
      {
        cronjobId: args.cronjobId,
        executionId: args.executionId,
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

    logger.error('[WP06] Unexpected error in cronjob execution abort handler', { error });
    return formatToolResponse('error', `Failed to abort cronjob execution: ${error instanceof Error ? error.message : String(error)}`);
  }
};
