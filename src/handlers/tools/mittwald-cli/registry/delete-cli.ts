import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { deleteRegistry, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldRegistryDeleteCliArgs {
  registryId: string;
  confirm?: boolean;
  quiet?: boolean;
  force?: boolean;
}

export const handleRegistryDeleteCli: MittwaldCliToolHandler<MittwaldRegistryDeleteCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.registryId) {
    return formatToolResponse('error', 'Registry ID is required. Please provide the registryId parameter.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Registry deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[RegistryDelete] Destructive operation attempted', {
    registryId: args.registryId,
    force: Boolean(args.force),
    sessionId: effectiveSessionId,
  });

  try {
    const result = await deleteRegistry({
      registryId: args.registryId,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      'Registry deleted successfully',
      {
        registryId: args.registryId,
        status: 'deleted',
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

    logger.error('[WP06] Unexpected error in registry delete handler', { error });
    return formatToolResponse('error', `Failed to delete registry: ${error instanceof Error ? error.message : String(error)}`);
  }
};
