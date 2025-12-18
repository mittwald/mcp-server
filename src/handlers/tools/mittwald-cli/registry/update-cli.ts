import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { updateRegistry, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldRegistryUpdateCliArgs {
  registryId: string;
  quiet?: boolean;
  description?: string;
  uri?: string;
  username?: string;
  password?: string;
}

export const handleRegistryUpdateCli: MittwaldCliToolHandler<MittwaldRegistryUpdateCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.registryId) {
    return formatToolResponse('error', 'Registry ID is required. Please provide the registryId parameter.');
  }

  if (!args.description && !args.uri && !args.username && !args.password) {
    return formatToolResponse('error', 'At least one update parameter must be provided (description, uri, username, password).');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await updateRegistry({
      registryId: args.registryId,
      description: args.description || '',
      apiToken: session.mittwaldAccessToken,
    });

    const updates = {
      description: args.description,
      uri: args.uri,
      username: args.username,
    };

    return formatToolResponse(
      'success',
      'Registry updated successfully',
      {
        registryId: args.registryId,
        status: 'updated',
        updates,
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

    logger.error('[WP06] Unexpected error in registry update handler', { error });
    return formatToolResponse('error', `Failed to update registry: ${error instanceof Error ? error.message : String(error)}`);
  }
};
