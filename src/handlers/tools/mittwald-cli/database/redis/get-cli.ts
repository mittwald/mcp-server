import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { getRedisDatabase, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDatabaseRedisGetArgs {
  redisId: string;
  outputFormat?: 'json' | 'yaml' | 'txt';
}

export const handleDatabaseRedisGetCli: MittwaldCliToolHandler<MittwaldDatabaseRedisGetArgs> = async (
  args,
  sessionId,
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.redisId) {
    return formatToolResponse('error', 'Redis database ID is required to fetch details.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await getRedisDatabase({
      databaseId: args.redisId,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      `Retrieved Redis database ${args.redisId}.`,
      result.data,
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

    logger.error('[WP06] Unexpected error in database redis get handler', { error });
    return formatToolResponse('error', `Failed to retrieve Redis database: ${error instanceof Error ? error.message : String(error)}`);
  }
};
