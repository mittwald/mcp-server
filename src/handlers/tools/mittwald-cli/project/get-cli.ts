import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getProject, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldProjectGetArgs {
  projectId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleProjectGetCli: MittwaldCliToolHandler<MittwaldProjectGetArgs> = async (args, sessionId) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required.');
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
    const result = await getProject({
      projectId: args.projectId,
      apiToken: session.mittwaldAccessToken,
    });

    const project = result.data as Record<string, unknown>;

    return formatToolResponse(
      'success',
      `Project details for ${args.projectId}`,
      {
        id: project.id,
        shortId: project.shortId,
        description: project.description,
        createdAt: project.createdAt,
        serverId: project.serverId,
        enabled: project.enabled,
        readiness: project.readiness,
        projectHostingSettings: project.projectHostingSettings,
        clusterSettings: project.clusterSettings,
        outputFormat: 'json',
      },
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

    logger.error('[WP06] Unexpected error in project get handler', { error });
    return formatToolResponse('error', `Failed to get project details: ${error instanceof Error ? error.message : String(error)}`);
  }
};
