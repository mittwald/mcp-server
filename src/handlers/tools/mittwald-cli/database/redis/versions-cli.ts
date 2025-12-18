import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { getDatabaseVersions, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDatabaseRedisVersionsArgs {
  projectId?: string;
  outputFormat?: 'json' | 'yaml' | 'txt' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleDatabaseRedisVersionsCli: MittwaldCliToolHandler<MittwaldDatabaseRedisVersionsArgs> = async (
  args,
  sessionId,
) => {
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
      type: 'redis',
      apiToken: session.mittwaldAccessToken,
    });

    const versions = result.data as any[];

    return formatToolResponse(
      'success',
      versions && versions.length > 0 ? `Found ${versions.length} Redis version(s).` : 'No Redis versions available.',
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

    logger.error('[WP06] Unexpected error in database redis versions handler', { error });
    return formatToolResponse('error', `Failed to list Redis versions: ${error instanceof Error ? error.message : String(error)}`);
  }
};
