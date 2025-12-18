import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { getDnsZone, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDomainDnszoneGetArgs {
  dnszoneId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleDomainDnszoneGetCli: MittwaldCliToolHandler<MittwaldDomainDnszoneGetArgs> = async (args, sessionId) => {
  if (!args.dnszoneId) {
    return formatToolResponse('error', 'DNS zone ID is required.');
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await getDnsZone({
      dnsZoneId: args.dnszoneId,
      apiToken: session.mittwaldAccessToken,
    });

    const item = result.data as any;

    const formattedData = {
      id: item.id,
      domainName: item.domainName,
      projectId: item.projectId,
      recordCount: item.recordCount,
      zone: item.zone,
      domain: item.domain,
      records: item.records || [],
    };

    return formatToolResponse(
      'success',
      `DNS zone information retrieved for ${args.dnszoneId}`,
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

    logger.error('[WP06] Unexpected error in domain dnszone get handler', { error });
    return formatToolResponse('error', `Failed to get DNS zone: ${error instanceof Error ? error.message : String(error)}`);
  }
};
