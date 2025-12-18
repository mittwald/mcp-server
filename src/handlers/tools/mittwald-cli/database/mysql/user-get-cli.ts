import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { getMysqlUser, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDatabaseMysqlUserGetArgs {
  userId: string;
  outputFormat?: 'json' | 'yaml' | 'txt';
}

export const handleDatabaseMysqlUserGetCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlUserGetArgs> = async (
  args,
  sessionId,
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.userId) {
    return formatToolResponse('error', 'User ID is required to fetch MySQL user details.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await getMysqlUser({
      userId: args.userId,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      `Retrieved MySQL user ${args.userId}.`,
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

    logger.error('[WP06] Unexpected error in database mysql user get handler', { error });
    return formatToolResponse('error', `Failed to retrieve MySQL user: ${error instanceof Error ? error.message : String(error)}`);
  }
};
