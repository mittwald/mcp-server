import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listCronjobExecutions, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCronjobExecutionListCliArgs {
  cronjobId: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function formatExecutions(data: unknown[]): Record<string, unknown>[] {
  return data.map((item) => {
    if (typeof item !== 'object' || item === null) {
      return { raw: item };
    }

    const record = item as Record<string, unknown>;

    return {
      id: record.id,
      cronjobId: record.cronjobId,
      status: record.status,
      startedAt: record.startedAt,
      finishedAt: record.finishedAt,
      exitCode: record.exitCode,
      duration: record.duration,
      triggeredBy: record.triggeredBy,
      raw: record,
    };
  });
}

export const handleCronjobExecutionListCli: MittwaldCliToolHandler<MittwaldCronjobExecutionListCliArgs> = async (args, sessionId) => {
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
    const result = await listCronjobExecutions({
      cronjobId: args.cronjobId,
      apiToken: session.mittwaldAccessToken,
    });

    const executions = result.data as any[];

    if (!executions || executions.length === 0) {
      return formatToolResponse(
        'success',
        'No cronjob executions found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    const formatted = formatExecutions(executions);

    return formatToolResponse(
      'success',
      `Found ${formatted.length} cronjob execution(s)`,
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

    logger.error('[WP06] Unexpected error in cronjob execution list handler', { error });
    return formatToolResponse('error', `Failed to list cronjob executions: ${error instanceof Error ? error.message : String(error)}`);
  }
};
