import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { updateProject, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldProjectUpdateArgs {
  projectId: string;
  description?: string;
  quiet?: boolean;
}

function buildSuccessPayload(args: MittwaldProjectUpdateArgs, quietValue?: string) {
  return {
    projectId: args.projectId,
    description: args.description,
    quietOutput: quietValue,
  };
}

export const handleProjectUpdateCli: MittwaldCliToolHandler<MittwaldProjectUpdateArgs> = async (args, sessionId) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required.');
  }

  if (!args.description) {
    return formatToolResponse('error', 'No update parameters provided. Please specify at least one field to update (e.g., description).');
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
    const result = await updateProject({
      projectId: args.projectId,
      description: args.description!,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      `Project ${args.projectId} updated successfully`,
      buildSuccessPayload(args, args.quiet ? args.projectId : undefined),
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

    logger.error('[WP06] Unexpected error in project update handler', { error });
    return formatToolResponse('error', `Failed to update project: ${error instanceof Error ? error.message : String(error)}`);
  }
};
