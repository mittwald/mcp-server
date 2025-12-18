import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { deleteMailAddress, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldMailAddressDeleteArgs {
  id: string;
  confirm?: boolean;
  quiet?: boolean;
  force?: boolean;
}

export const handleMittwaldMailAddressDeleteCli: MittwaldCliToolHandler<MittwaldMailAddressDeleteArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.id) {
    return formatToolResponse('error', 'id is required');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Mail address deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  logger.warn('[MailAddressDelete] Destructive operation attempted', {
    addressId: args.id,
    force: Boolean(args.force),
    sessionId: effectiveSessionId,
  });

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await deleteMailAddress({
      mailAddressId: args.id,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      `Successfully deleted mail address: ${args.id}`,
      {
        id: args.id,
        deleted: true,
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

    logger.error('[WP06] Unexpected error in mail address delete handler', { error });
    return formatToolResponse('error', `Failed to delete mail address: ${error instanceof Error ? error.message : String(error)}`);
  }
};
