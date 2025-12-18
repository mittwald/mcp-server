import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { createProject, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldProjectCreateArgs {
  description: string;
  serverId?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: string;
  updateContext?: boolean;
}

export const handleProjectCreateCli: MittwaldCliToolHandler<MittwaldProjectCreateArgs> = async (args, sessionId) => {
  if (!args.serverId) {
    return formatToolResponse('error', 'serverId is required');
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
    const result = await createProject({
      serverId: args.serverId!,
      description: args.description,
      apiToken: session.mittwaldAccessToken,
    });

    const projectData = result.data as any;
    const projectId = projectData?.id || projectData;

    // Auto-update session: add new project to accessible projects and set as context
    if (projectId && effectiveSessionId) {
      const { sessionAwareCli } = await import('../../../../utils/session-aware-cli.js');
      await sessionAwareCli.handleProjectCreated(effectiveSessionId, projectId, args.updateContext !== false);
      logger.info(`Session updated with new project ${projectId}`);
    }

    return formatToolResponse(
      'success',
      'Project created successfully',
      {
        projectId,
        description: args.description,
        serverId: args.serverId,
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

    logger.error('[WP06] Unexpected error in project create handler', { error });
    return formatToolResponse('error', `Failed to create project: ${error instanceof Error ? error.message : String(error)}`);
  }
};
