import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listCronjobs, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCronjobListCliArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function formatCronjobs(data: unknown[]): Record<string, unknown>[] {
  return data.map((item) => {
    if (typeof item !== 'object' || item === null) {
      return { raw: item };
    }

    const record = item as Record<string, unknown>;
    return {
      id: record.id,
      description: record.description,
      expression: record.expression,
      command: record.command,
      enabled: record.enabled,
      projectId: record.projectId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      raw: record,
    };
  });
}

export const handleCronjobListCli: MittwaldCliToolHandler<MittwaldCronjobListCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listCronjobs({
      projectId: args.projectId!,
      apiToken: session.mittwaldAccessToken,
    });

    const cronjobs = result.data as any[];

    if (!cronjobs || cronjobs.length === 0) {
      return formatToolResponse(
        'success',
        'No cronjobs found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    const formatted = formatCronjobs(cronjobs);

    return formatToolResponse(
      'success',
      `Found ${formatted.length} cronjob(s)`,
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

    logger.error('[WP06] Unexpected error in cronjob list handler', { error });
    return formatToolResponse('error', `Failed to list cronjobs: ${error instanceof Error ? error.message : String(error)}`);
  }
};
