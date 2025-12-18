import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { updateDnsZone, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDomainDnszoneUpdateArgs {
  dnszoneId: string;
  recordSet: 'a' | 'mx' | 'txt' | 'srv' | 'cname';
  projectId?: string;
  set?: string[];
  recordId?: string;
  unset?: string[];
  quiet?: boolean;
  managed?: boolean;
  record?: string[];
  ttl?: number;
}

export const handleDomainDnszoneUpdateCli: MittwaldCliToolHandler<MittwaldDomainDnszoneUpdateArgs> = async (
  args,
  sessionId,
) => {
  if (!args.dnszoneId) {
    return formatToolResponse('error', 'DNS zone ID is required.');
  }

  if (!args.recordSet) {
    return formatToolResponse('error', 'Record set type is required.');
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
    // Build recordSet payload for library
    const recordSetPayload: any = {
      [args.recordSet]: {
        records: args.record || [],
      },
    };

    if (args.ttl !== undefined) {
      recordSetPayload[args.recordSet].ttl = args.ttl;
    }

    if (args.managed !== undefined) {
      recordSetPayload[args.recordSet].managed = args.managed;
    }

    const result = await updateDnsZone({
      dnsZoneId: args.dnszoneId,
      recordSetType: args.recordSet,
      recordSet: recordSetPayload,
      apiToken: session.mittwaldAccessToken,
    });

    // DNS zone update returns void (204 No Content), so we build a success payload
    const payload = {
      success: true,
      message: `DNS zone ${args.dnszoneId} record set '${args.recordSet}' updated successfully`,
      dnszoneId: args.dnszoneId,
      recordSet: args.recordSet,
      recordsSet: args.record || null,
      ttl: args.ttl ?? null,
      managed: args.managed ?? false,
      unset: args.unset ?? false,
    };

    return formatToolResponse(
      'success',
      `DNS zone ${args.dnszoneId} record set '${args.recordSet}' updated successfully`,
      payload,
      {
        durationMs: result.durationMs,
      },
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP06] Unexpected error in domain dnszone update handler', { error });
    return formatToolResponse(
      'error',
      `Failed to update DNS zone: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
