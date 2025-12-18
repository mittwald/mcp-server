import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listDomains, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldDomainListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

type RawDomainListItem = {
  domain?: string;
  connected?: boolean;
  deleted?: boolean;
  nameservers?: string[];
  usesDefaultNameserver?: boolean;
  projectId?: string;
  contactHash?: string;
  authCode?: string;
};

export const handleDomainListCli: MittwaldCliToolHandler<MittwaldDomainListArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listDomains({
      projectId: args.projectId,
      apiToken: session.mittwaldAccessToken,
    });

    const domains = result.data as any[];

    if (!domains || domains.length === 0) {
      return formatToolResponse(
        'success',
        'No domains found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    const formatted = domains.map((item) => ({
      domain: item.domain,
      connected: item.connected,
      deleted: item.deleted,
      nameservers: item.nameservers,
      usesDefaultNameserver: item.usesDefaultNameserver,
      projectId: item.projectId,
      contactHash: item.contactHash,
      authCode: item.authCode,
    }));

    return formatToolResponse(
      'success',
      `Found ${formatted.length} domain(s)`,
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

    logger.error('[WP06] Unexpected error in domain list handler', { error });
    return formatToolResponse('error', `Failed to list domains: ${error instanceof Error ? error.message : String(error)}`);
  }
};
