import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { getUserSession, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserSessionGetArgs {
  tokenId: string;
  output?: 'txt' | 'json' | 'yaml';
}

interface RawSession {
  id?: string;
  tokenId?: string;
  createdAt?: string;
  expiresAt?: string;
  userAgent?: string;
  ipAddress?: string;
  [key: string]: unknown;
}

export const handleUserSessionGetCli: MittwaldCliToolHandler<MittwaldUserSessionGetArgs> = async (args, sessionId) => {
  if (!args.tokenId || !args.tokenId.trim()) {
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
    const result = await getUserSession({
      sessionId: args.tokenId,
      apiToken: session.mittwaldAccessToken,
    });

    const sessionData = result.data as Record<string, unknown>;
    const formattedData = {
      id: sessionData.id,
      tokenId: sessionData.tokenId,
      createdAt: sessionData.createdAt,
      expiresAt: sessionData.expiresAt,
      userAgent: sessionData.userAgent,
      ipAddress: sessionData.ipAddress,
      ...sessionData,
    };

    return formatToolResponse(
      'success',
      `Session information retrieved for ${args.tokenId}`,
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

    logger.error('[WP06] Unexpected error in user session get handler', { error });
    return formatToolResponse('error', `Failed to get session: ${error instanceof Error ? error.message : String(error)}`);
  }
};
