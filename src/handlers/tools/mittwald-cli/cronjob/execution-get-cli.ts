import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getCronjobExecution, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCronjobExecutionGetCliArgs {
  cronjobId: string;
  executionId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function formatExecution(data: Record<string, unknown>): Record<string, unknown> {
  return {
    id: data.id,
    cronjobId: data.cronjobId,
    status: data.status,
    startedAt: data.startedAt,
    finishedAt: data.finishedAt,
    exitCode: data.exitCode,
    duration: data.duration,
    triggeredBy: data.triggeredBy,
    raw: data,
  };
}

export const handleCronjobExecutionGetCli: MittwaldCliToolHandler<MittwaldCronjobExecutionGetCliArgs> = async (args, sessionId) => {
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
    const result = await getCronjobExecution({
      cronjobId: args.cronjobId,
      executionId: args.executionId,
      apiToken: session.mittwaldAccessToken,
    });

    const execution = result.data as Record<string, unknown>;
    const formatted = formatExecution(execution);
    const executionId = typeof formatted.id === 'string' ? formatted.id : args.executionId;

    return formatToolResponse(
      'success',
      `Cronjob execution details for ${executionId}`,
      formatted,
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

    logger.error('[WP06] Unexpected error in cronjob execution get handler', { error });
    return formatToolResponse('error', `Failed to get cronjob execution: ${error instanceof Error ? error.message : String(error)}`);
  }
};
