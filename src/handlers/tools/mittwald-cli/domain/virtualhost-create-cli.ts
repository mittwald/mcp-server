import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { createVirtualHost, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldDomainVirtualhostCreateArgs {
  hostname: string;
  projectId?: string;
  quiet?: boolean;
  pathToApp?: string[];
  pathToUrl?: string[];
  pathToContainer?: string[];
}

function parsePathMappings(args: MittwaldDomainVirtualhostCreateArgs): any[] {
  const paths: any[] = [];

  // Parse path-to-app mappings (format: "path=/,appInstallationId=123")
  if (args.pathToApp) {
    for (const mapping of args.pathToApp) {
      const parts = mapping.split(',');
      const pathPart = parts.find(p => p.startsWith('path='));
      const appPart = parts.find(p => p.startsWith('appInstallationId='));
      if (pathPart && appPart) {
        paths.push({
          path: pathPart.split('=')[1],
          target: { appInstallationId: appPart.split('=')[1] }
        });
      }
    }
  }

  // Parse path-to-url mappings (format: "path=/,url=https://example.com")
  if (args.pathToUrl) {
    for (const mapping of args.pathToUrl) {
      const parts = mapping.split(',');
      const pathPart = parts.find(p => p.startsWith('path='));
      const urlPart = parts.find(p => p.startsWith('url='));
      if (pathPart && urlPart) {
        paths.push({
          path: pathPart.split('=')[1],
          target: { url: urlPart.split('=')[1] }
        });
      }
    }
  }

  // Parse path-to-container mappings (format: "path=/,containerId=123")
  if (args.pathToContainer) {
    for (const mapping of args.pathToContainer) {
      const parts = mapping.split(',');
      const pathPart = parts.find(p => p.startsWith('path='));
      const containerPart = parts.find(p => p.startsWith('containerId='));
      if (pathPart && containerPart) {
        paths.push({
          path: pathPart.split('=')[1],
          target: { containerId: containerPart.split('=')[1] }
        });
      }
    }
  }

  return paths;
}

export const handleDomainVirtualhostCreateCli: MittwaldCliToolHandler<MittwaldDomainVirtualhostCreateArgs> = async (args, sessionId) => {
  if (!args.hostname) {
    return formatToolResponse('error', 'Hostname is required.');
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const paths = parsePathMappings(args);

  try {
    const result = await createVirtualHost({
      hostname: args.hostname,
      paths: paths,
      projectId: args.projectId || '',
      apiToken: session.mittwaldAccessToken,
    });

    const ingressId = result.data?.id || result.data?.ingressId;

    const resultData = {
      id: ingressId,
      hostname: args.hostname,
      ...(args.pathToApp && { pathToApp: args.pathToApp }),
      ...(args.pathToUrl && { pathToUrl: args.pathToUrl }),
      ...(args.pathToContainer && { pathToContainer: args.pathToContainer }),
    };

    return formatToolResponse(
      'success',
      args.quiet ? ingressId : `Successfully created virtual host '${args.hostname}' with ID ${ingressId}`,
      resultData,
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

    logger.error('[WP06] Unexpected error in virtualhost create handler', { error });
    return formatToolResponse('error', `Failed to create virtual host: ${error instanceof Error ? error.message : String(error)}`);
  }
};
