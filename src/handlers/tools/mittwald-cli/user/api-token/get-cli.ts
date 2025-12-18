import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { getUserApiToken, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserApiTokenGetArgs {
  tokenId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleUserApiTokenGetCli: MittwaldCliToolHandler<MittwaldUserApiTokenGetArgs> = async (args, sessionId) => {
  if (!args.tokenId) {
    return formatToolResponse('error', 'Token ID is required.');
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
    const result = await getUserApiToken({
      tokenId: args.tokenId,
      apiToken: session.mittwaldAccessToken,
    });

    const parsed = result.data as Record<string, unknown>;
    const formattedData = {
      id: parsed.id,
      description: parsed.description,
      roles: parsed.roles,
      createdAt: parsed.createdAt,
      expiresAt: parsed.expiresAt,
      ...parsed,
    };

    return formatToolResponse(
      'success',
      `API token information retrieved for ${args.tokenId}`,
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

    logger.error('[WP06] Unexpected error in user api token get handler', { error });
    return formatToolResponse('error', `Failed to get API token: ${error instanceof Error ? error.message : String(error)}`);
  }
};
