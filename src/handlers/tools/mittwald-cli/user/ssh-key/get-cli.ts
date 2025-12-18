import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { getUserSshKey, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserSshKeyGetArgs {
  keyId: string;
  output?: 'txt' | 'json' | 'yaml';
}

interface RawSshKey {
  id?: string;
  comment?: string;
  fingerprint?: string;
  publicKey?: string;
  createdAt?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

export const handleUserSshKeyGetCli: MittwaldCliToolHandler<MittwaldUserSshKeyGetArgs> = async (args, sessionId) => {
  if (!args.keyId || !args.keyId.trim()) {
    return formatToolResponse('error', 'SSH key ID is required.');
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await getUserSshKey({
      sshKeyId: args.keyId,
      apiToken: session.mittwaldAccessToken,
    });

    const key = result.data as Record<string, unknown>;
    const formattedData = {
      id: key.id,
      comment: key.comment,
      fingerprint: key.fingerprint,
      publicKey: key.publicKey,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      ...key,
    };

    return formatToolResponse(
      'success',
      `SSH key information retrieved for ${args.keyId}`,
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

    logger.error('[WP06] Unexpected error in user ssh key get handler', { error });
    return formatToolResponse('error', `Failed to get SSH key: ${error instanceof Error ? error.message : String(error)}`);
  }
};
