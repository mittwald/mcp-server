import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { listDnsZones, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDomainDnszoneListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

type RawDnszoneListItem = {
  id?: string;
  domainName?: string;
  projectId?: string;
  recordCount?: number;
  zone?: string;
  domain?: string;
};

export const handleDomainDnszoneListCli: MittwaldCliToolHandler<MittwaldDomainDnszoneListArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listDnsZones({
      projectId: args.projectId,
      apiToken: session.mittwaldAccessToken,
    });

    const items = result.data as RawDnszoneListItem[];

    if (!items || items.length === 0) {
      return formatToolResponse(
        'success',
        'No DNS zones found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    const formatted = items.map((item) => ({
      id: item.id,
      domainName: item.domainName,
      projectId: item.projectId,
      recordCount: item.recordCount,
      zone: item.zone,
      domain: item.domain,
    }));

    return formatToolResponse(
      'success',
      `Found ${formatted.length} DNS zone(s)`,
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

    logger.error('[WP06] Unexpected error in domain dnszone list handler', { error });
    return formatToolResponse('error', `Failed to list DNS zones: ${error instanceof Error ? error.message : String(error)}`);
  }
};
