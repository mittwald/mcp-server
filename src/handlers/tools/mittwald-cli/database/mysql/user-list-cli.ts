import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { listMysqlUsers, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDatabaseMysqlUserListArgs {
  databaseId: string;
  outputFormat?: 'json' | 'yaml' | 'txt' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleDatabaseMysqlUserListCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlUserListArgs> = async (
  args,
  sessionId,
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required to list MySQL users.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listMysqlUsers({
      databaseId: args.databaseId,
      apiToken: session.mittwaldAccessToken,
    });

    const users = result.data as any[];

    if (!users || users.length === 0) {
      return formatToolResponse(
        'success',
        `No MySQL users found for database ${args.databaseId}.`,
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Found ${users.length} MySQL user(s) for database ${args.databaseId}.`,
      users,
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

    logger.error('[WP06] Unexpected error in database mysql user list handler', { error });
    return formatToolResponse('error', `Failed to list MySQL users: ${error instanceof Error ? error.message : String(error)}`);
  }
};
