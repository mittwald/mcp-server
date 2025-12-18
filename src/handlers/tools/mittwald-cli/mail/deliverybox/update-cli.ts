import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { updateDeliveryBox, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldMailDeliveryboxUpdateArgs {
  id: string;
  description?: string;
  quiet?: boolean;
  password?: string;
  randomPassword?: boolean;
}

export const handleMittwaldMailDeliveryboxUpdateCli: MittwaldCliToolHandler<MittwaldMailDeliveryboxUpdateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.id) {
    return formatToolResponse('error', 'id is required');
  }

  // Check for unsupported library features
  if (args.password || args.randomPassword) {
    logger.warn('[WP06] Update delivery box: password updates not supported in library mode', {
      hasPassword: Boolean(args.password),
      hasRandomPassword: Boolean(args.randomPassword),
    });

    return formatToolResponse('error',
      'Password updates (password, randomPassword) are not yet supported in library mode. ' +
      'Only description updates are currently available.'
    );
  }

  if (!args.description) {
    return formatToolResponse('error', 'description must be specified to update delivery box');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await updateDeliveryBox({
      deliveryBoxId: args.id,
      description: args.description,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      `Successfully updated delivery box: ${args.id}`,
      {
        id: args.id,
        updated: true,
        description: args.description,
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

    logger.error('[WP06] Unexpected error in mail deliverybox update handler', { error });
    return formatToolResponse('error', `Failed to update delivery box: ${error instanceof Error ? error.message : String(error)}`);
  }
};
