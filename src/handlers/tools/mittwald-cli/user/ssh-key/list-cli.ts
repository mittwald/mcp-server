import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { listUserSshKeys, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserSshKeyListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

interface RawSshKeyItem {
  id?: string;
  comment?: string;
  fingerprint?: string;
  publicKey?: string;
  createdAt?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

export const handleUserSshKeyListCli: MittwaldCliToolHandler<MittwaldUserSshKeyListArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listUserSshKeys({
      apiToken: session.mittwaldAccessToken,
    });

    const keys = result.data as any[];

    if (!keys || keys.length === 0) {
      return formatToolResponse(
        'success',
        'No SSH keys found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    const formatted = keys.map((key) => ({
      id: key.id,
      comment: key.comment,
      fingerprint: key.fingerprint,
      publicKey: key.publicKey,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      ...key,
    }));

    return formatToolResponse(
      'success',
      `Found ${keys.length} SSH key(s)`,
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

    logger.error('[WP06] Unexpected error in user ssh key list handler', { error });
    return formatToolResponse('error', `Failed to list SSH keys: ${error instanceof Error ? error.message : String(error)}`);
  }
};
