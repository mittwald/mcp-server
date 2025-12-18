import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getCronjob, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCronjobGetCliArgs {
  cronjobId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function formatCronjob(data: Record<string, unknown>): Record<string, unknown> {
  return {
    id: data.id,
    description: data.description,
    expression: data.expression,
    command: data.command,
    enabled: data.enabled,
    projectId: data.projectId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    lastExecutedAt: data.lastExecutedAt,
    raw: data,
  };
}

export const handleCronjobGetCli: MittwaldCliToolHandler<MittwaldCronjobGetCliArgs> = async (args, sessionId) => {
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
    const result = await getCronjob({
      cronjobId: args.cronjobId,
      apiToken: session.mittwaldAccessToken,
    });

    const cronjob = result.data;
    const formatted = formatCronjob(cronjob as Record<string, unknown>);
    const cronjobId = typeof formatted.id === 'string' ? formatted.id : args.cronjobId;

    return formatToolResponse(
      'success',
      `Cronjob details for ${cronjobId}`,
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

    logger.error('[WP06] Unexpected error in cronjob get handler', { error });
    return formatToolResponse('error', `Failed to get cronjob: ${error instanceof Error ? error.message : String(error)}`);
  }
};
