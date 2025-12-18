import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listProjects, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldProjectListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  csvSeparator?: ',' | ';';
  noHeader?: boolean;
  noRelativeDates?: boolean;
  noTruncate?: boolean;
}

function formatProjects(data: unknown[]): Array<{
  id: unknown;
  shortId: unknown;
  description: unknown;
  createdAt: unknown;
  serverId: unknown;
  enabled: unknown;
  readiness: unknown;
}> {
  return data.map((item) => {
    const record = (item ?? {}) as Record<string, unknown>;
    return {
      id: record.id,
      shortId: record.shortId,
      description: record.description,
      createdAt: record.createdAt,
      serverId: record.serverId,
      enabled: record.enabled,
      readiness: record.readiness,
    };
  });
}

export const handleMittwaldProjectListCli: MittwaldCliToolHandler<MittwaldProjectListArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listProjects({
      apiToken: session.mittwaldAccessToken,
    });

    const projects = result.data as any[];

    if (!projects || projects.length === 0) {
      return formatToolResponse(
        'success',
        'No projects found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    const formatted = formatProjects(projects);

    return formatToolResponse(
      'success',
      `Found ${formatted.length} project(s)`,
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

    logger.error('[WP06] Unexpected error in project list handler', { error });
    return formatToolResponse('error', `Failed to list projects: ${error instanceof Error ? error.message : String(error)}`);
  }
};
