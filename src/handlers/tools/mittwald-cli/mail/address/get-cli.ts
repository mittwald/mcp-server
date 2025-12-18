import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { getMailAddress, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldMailAddressGetArgs {
  id: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleMittwaldMailAddressGetCli: MittwaldCliToolHandler<MittwaldMailAddressGetArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.id) {
    return formatToolResponse('error', 'id is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await getMailAddress({
      mailAddressId: args.id,
      apiToken: session.mittwaldAccessToken,
    });

    const mailAddress = result.data as any;
    const label = mailAddress?.address ?? args.id;

    return formatToolResponse(
      'success',
      `Retrieved mail address: ${label}`,
      mailAddress,
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

    logger.error('[WP06] Unexpected error in mail address get handler', { error });
    return formatToolResponse('error', `Failed to get mail address: ${error instanceof Error ? error.message : String(error)}`);
  }
};
