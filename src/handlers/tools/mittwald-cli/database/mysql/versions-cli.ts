import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { getDatabaseVersions, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDatabaseMysqlVersionsArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleDatabaseMysqlVersionsCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlVersionsArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await getDatabaseVersions({
      type: 'mysql',
      apiToken: session.mittwaldAccessToken,
    });

    const versions = result.data as any[];
    const count = Array.isArray(versions) ? versions.length : 'MySQL';

    return formatToolResponse(
      'success',
      `Successfully retrieved ${count} versions`,
      versions,
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

    logger.error('[WP06] Unexpected error in database mysql versions handler', { error });
    return formatToolResponse('error', `Failed to list MySQL versions: ${error instanceof Error ? error.message : String(error)}`);
  }
};
