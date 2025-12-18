import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getDomain, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldDomainGetArgs {
  domainId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleDomainGetCli: MittwaldCliToolHandler<MittwaldDomainGetArgs> = async (args, sessionId) => {
  if (!args.domainId) {
    return formatToolResponse('error', 'Domain ID is required.');
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
    const result = await getDomain({
      domainId: args.domainId,
      apiToken: session.mittwaldAccessToken,
    });

    const domain = result.data as any;

    const formattedData = {
      domain: domain.domain,
      connected: domain.connected,
      deleted: domain.deleted,
      nameservers: domain.nameservers,
      usesDefaultNameserver: domain.usesDefaultNameserver,
      projectId: domain.projectId,
      contactHash: domain.contactHash,
      authCode: domain.authCode,
      id: domain.id,
    };

    return formatToolResponse(
      'success',
      `Domain information retrieved for ${args.domainId}`,
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

    logger.error('[WP06] Unexpected error in domain get handler', { error });
    return formatToolResponse('error', `Failed to get domain: ${error instanceof Error ? error.message : String(error)}`);
  }
};
