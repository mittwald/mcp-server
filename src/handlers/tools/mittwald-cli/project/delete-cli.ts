import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { deleteProject, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldProjectDeleteArgs {
  projectId: string;
  confirm?: boolean;
  quiet?: boolean;
  force?: boolean;
}

export const handleProjectDeleteCli: MittwaldCliToolHandler<MittwaldProjectDeleteArgs> = async (args, sessionId) => {
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;

  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Project deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  logger.warn('[ProjectDelete] Destructive operation attempted', {
    projectId: args.projectId,
    force: Boolean(args.force),
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const effectiveSessionId = resolvedSessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await deleteProject({
      projectId: args.projectId,
      apiToken: session.mittwaldAccessToken,
    });

    // Auto-update session: remove deleted project from accessible projects and clear context if active
    if (effectiveSessionId) {
      const { sessionAwareCli } = await import('../../../../utils/session-aware-cli.js');
      await sessionAwareCli.handleProjectDeleted(effectiveSessionId, args.projectId);
      logger.info(`Session updated after deleting project ${args.projectId}`);
    }

    const message = `Project ${args.projectId} deleted successfully`;

    return formatToolResponse(
      'success',
      message,
      {
        projectId: args.projectId,
        deleted: true,
        force: Boolean(args.force),
        quiet: Boolean(args.quiet),
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

    logger.error('[WP06] Unexpected error in project delete handler', { error });
    return formatToolResponse('error', `Failed to delete project: ${error instanceof Error ? error.message : String(error)}`);
  }
};
