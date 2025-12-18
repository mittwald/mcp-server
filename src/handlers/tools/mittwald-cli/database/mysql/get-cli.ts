import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { getMysqlDatabase, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDatabaseMysqlGetArgs {
  databaseId: string;
  output?: "txt" | "json" | "yaml";
}

export const handleDatabaseMysqlGetCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlGetArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await getMysqlDatabase({
      databaseId: args.databaseId,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      `Successfully retrieved MySQL database information for ${args.databaseId}`,
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

    logger.error('[WP06] Unexpected error in database mysql get handler', { error });
    return formatToolResponse('error', `Failed to get MySQL database: ${error instanceof Error ? error.message : String(error)}`);
  }
};
