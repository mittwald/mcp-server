import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { listUserSessions, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserSessionListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

interface RawSessionItem {
  id?: string;
  tokenId?: string;
  createdAt?: string;
  expiresAt?: string;
  userAgent?: string;
  ipAddress?: string;
  [key: string]: unknown;
}

export const handleUserSessionListCli: MittwaldCliToolHandler<MittwaldUserSessionListArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listUserSessions({
      apiToken: session.mittwaldAccessToken,
    });

    const sessions = result.data as any[];

    if (!sessions || sessions.length === 0) {
      return formatToolResponse(
        'success',
        'No active sessions found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    const formattedData = sessions.map((session) => ({
      id: session.id,
      tokenId: session.tokenId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      ...session,
    }));

    return formatToolResponse(
      'success',
      `Found ${sessions.length} active session(s)`,
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

    logger.error('[WP06] Unexpected error in user session list handler', { error });
    return formatToolResponse('error', `Failed to list sessions: ${error instanceof Error ? error.message : String(error)}`);
  }
};
