import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { createDeliveryBox, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldMailDeliveryboxCreateArgs {
  projectId?: string;
  description: string;
  quiet?: boolean;
  password?: string;
  randomPassword?: boolean;
}

export const handleMittwaldMailDeliveryboxCreateCli: MittwaldCliToolHandler<MittwaldMailDeliveryboxCreateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.description) {
    return formatToolResponse('error', 'description is required');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  // Check for unsupported library features
  if (args.randomPassword) {
    logger.warn('[WP06] Create delivery box: randomPassword not supported in library mode', {
      hasRandomPassword: true,
    });

    return formatToolResponse('error',
      'Random password generation is not yet supported in library mode. ' +
      'Please provide an explicit password using the password parameter.'
    );
  }

  if (!args.password) {
    return formatToolResponse('error', 'password is required (randomPassword not supported in library mode)');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await createDeliveryBox({
      projectId: args.projectId!,
      description: args.description,
      password: args.password!,
      apiToken: session.mittwaldAccessToken,
    });

    const deliveryBoxData = result.data as any;
    const deliveryBoxId = deliveryBoxData?.id ?? 'unknown';

    return formatToolResponse(
      'success',
      `Successfully created delivery box '${args.description}' with ID ${deliveryBoxId}`,
      {
        id: deliveryBoxId,
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

    logger.error('[WP06] Unexpected error in mail deliverybox create handler', { error });
    return formatToolResponse('error', `Failed to create delivery box: ${error instanceof Error ? error.message : String(error)}`);
  }
};
