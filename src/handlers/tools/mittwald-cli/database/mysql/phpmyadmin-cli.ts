import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { getPhpMyAdminUrl, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDatabaseMysqlPhpmyadminArgs {
  databaseId?: string;
}

export const handleDatabaseMysqlPhpmyadminCli: MittwaldCliToolHandler<
  MittwaldDatabaseMysqlPhpmyadminArgs
> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required. Please provide the databaseId parameter.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await getPhpMyAdminUrl({
      databaseId: args.databaseId,
      apiToken: session.mittwaldAccessToken,
    });

    const info = result.data;

    return formatToolResponse(
      'success',
      `phpMyAdmin URL for database ${info.database}`,
      {
        ...info,
        instructions:
          `Open this URL in a browser to manage the database as user ${info.mysqlUser}:\n\n${info.url}\n\n` +
          'This MCP server does not open browsers. The URL is user-specific; treat it as a credential and do not share it.',
      },
      { durationMs: result.durationMs }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('Unexpected error in phpMyAdmin handler', { error });
    return formatToolResponse(
      'error',
      `Failed to resolve phpMyAdmin URL: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
