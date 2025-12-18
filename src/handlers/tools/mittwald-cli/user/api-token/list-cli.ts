import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { listUserApiTokens, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserApiTokenListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleUserApiTokenListCli: MittwaldCliToolHandler<MittwaldUserApiTokenListArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listUserApiTokens({
      apiToken: session.mittwaldAccessToken,
    });

    const tokens = result.data as any[];

    if (!tokens || tokens.length === 0) {
      return formatToolResponse(
        'success',
        'No API tokens found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    const formatted = tokens.map((item) => ({
      id: item.id,
      description: item.description,
      roles: item.roles,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
      ...item,
    }));

    return formatToolResponse(
      'success',
      `Found ${formatted.length} API token(s)`,
      formatted,
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

    logger.error('[WP06] Unexpected error in user api token list handler', { error });
    return formatToolResponse('error', `Failed to list API tokens: ${error instanceof Error ? error.message : String(error)}`);
  }
};
