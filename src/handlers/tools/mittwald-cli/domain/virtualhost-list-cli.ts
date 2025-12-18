import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listVirtualHosts, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldDomainVirtualhostListArgs {
  projectId?: string;
  all?: boolean;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

type RawVirtualhostListItem = {
  id?: string;
  hostname?: string;
  projectId?: string;
  paths?: unknown;
  status?: string;
  ips?: unknown;
};

export const handleDomainVirtualhostListCli: MittwaldCliToolHandler<MittwaldDomainVirtualhostListArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listVirtualHosts({
      projectId: args.projectId,
      apiToken: session.mittwaldAccessToken,
    });

    const virtualhosts = result.data as any[];

    if (!virtualhosts || virtualhosts.length === 0) {
      return formatToolResponse(
        'success',
        'No virtual hosts found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    const formattedData = virtualhosts.map((item) => ({
      id: item.id,
      hostname: item.hostname,
      projectId: item.projectId,
      paths: item.paths,
      status: item.status,
      ips: item.ips,
    }));

    return formatToolResponse(
      'success',
      `Found ${formattedData.length} virtual host(s)`,
      formattedData,
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

    logger.error('[WP06] Unexpected error in virtualhost list handler', { error });
    return formatToolResponse('error', `Failed to list virtual hosts: ${error instanceof Error ? error.message : String(error)}`);
  }
};
