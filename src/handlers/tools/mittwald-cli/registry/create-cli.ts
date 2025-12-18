import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { createRegistry, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldRegistryCreateCliArgs {
  uri: string;
  description: string;
  projectId?: string;
  quiet?: boolean;
  username?: string;
  password?: string;
}

export const handleRegistryCreateCli: MittwaldCliToolHandler<MittwaldRegistryCreateCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.uri) {
    return formatToolResponse('error', "'uri' is required. Please provide the uri parameter.");
  }

  if (!args.description) {
    return formatToolResponse('error', "'description' is required. Please provide the description parameter.");
  }

  if (!args.projectId) {
    return formatToolResponse('error', "'projectId' is required. Please provide the projectId parameter.");
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await createRegistry({
      projectId: args.projectId!,
      description: args.description,
      uri: args.uri,
      apiToken: session.mittwaldAccessToken,
    });

    const registryData = result.data as { id?: string } | undefined;

    return formatToolResponse(
      'success',
      'Registry created successfully',
      {
        registryId: registryData?.id,
        uri: args.uri,
        description: args.description,
        projectId: args.projectId,
        username: args.username,
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

    logger.error('[WP06] Unexpected error in registry create handler', { error });
    return formatToolResponse('error', `Failed to create registry: ${error instanceof Error ? error.message : String(error)}`);
  }
};
