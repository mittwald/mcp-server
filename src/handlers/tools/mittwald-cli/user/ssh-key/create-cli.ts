import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { createUserSshKey, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserSshKeyCreateArgs {
  publicKey: string;
  quiet?: boolean;
  expires?: string;
  output?: string;
  noPassphrase?: boolean;
  comment?: string;
}

export const handleUserSshKeyCreateCli: MittwaldCliToolHandler<MittwaldUserSshKeyCreateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.publicKey) {
    return formatToolResponse('error', 'publicKey is required. Note: The library version requires an existing public key to import, it does not generate keys locally.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await createUserSshKey({
      publicKey: args.publicKey,
      comment: args.comment,
      expiresAt: args.expires,
      apiToken: session.mittwaldAccessToken,
    });

    const sshKey = result.data as any;

    return formatToolResponse(
      'success',
      'SSH key imported successfully',
      {
        sshKeyId: sshKey?.id,
        publicKey: args.publicKey,
        comment: args.comment,
        expiresAt: args.expires,
      },
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

    logger.error('[WP06] Unexpected error in user ssh key create handler', { error });
    return formatToolResponse('error', `Failed to create SSH key: ${error instanceof Error ? error.message : String(error)}`);
  }
};
