import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getVirtualHost, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldDomainVirtualhostGetArgs {
  virtualhostId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleDomainVirtualhostGetCli: MittwaldCliToolHandler<MittwaldDomainVirtualhostGetArgs> = async (args, sessionId) => {
  if (!args.virtualhostId) {
    return formatToolResponse('error', 'Virtual host ID is required.');
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
    const result = await getVirtualHost({
      ingressId: args.virtualhostId,
      apiToken: session.mittwaldAccessToken,
    });

    const virtualhost = result.data as any;

    const formattedData = {
      id: virtualhost.id,
      hostname: virtualhost.hostname,
      projectId: virtualhost.projectId,
      paths: virtualhost.paths,
      status: virtualhost.status,
      ips: virtualhost.ips,
      dnsValidationErrors: virtualhost.dnsValidationErrors ?? [],
    };

    return formatToolResponse(
      'success',
      `Virtual host details for ${formattedData.hostname ?? args.virtualhostId}`,
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

    logger.error('[WP06] Unexpected error in virtualhost get handler', { error });
    return formatToolResponse('error', `Failed to get virtual host: ${error instanceof Error ? error.message : String(error)}`);
  }
};
