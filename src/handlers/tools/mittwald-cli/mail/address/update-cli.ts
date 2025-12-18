import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { updateMailAddressCatchAll, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldMailAddressUpdateArgs {
  id: string;
  quiet?: boolean;
  catchAll?: boolean;
  enableSpamProtection?: boolean;
  quota?: string;
  password?: string;
  randomPassword?: boolean;
  forwardTo?: string[];
}

export const handleMittwaldMailAddressUpdateCli: MittwaldCliToolHandler<MittwaldMailAddressUpdateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.id) {
    return formatToolResponse('error', 'id is required');
  }

  // Check for unsupported library features
  if (args.enableSpamProtection !== undefined || args.quota || args.password || args.randomPassword || args.forwardTo) {
    logger.warn('[WP06] Update mail address: CLI-only features requested, falling back to CLI-only mode', {
      hasAdvancedFeatures: true,
      enableSpamProtection: args.enableSpamProtection,
      quota: args.quota,
      hasPassword: Boolean(args.password),
      randomPassword: args.randomPassword,
      hasForwardTo: Boolean(args.forwardTo),
    });

    return formatToolResponse('error',
      'Advanced mail address update options (enableSpamProtection, quota, password, randomPassword, forwardTo) are not yet supported in library mode. ' +
      'Only catchAll updates are currently available.'
    );
  }

  if (args.catchAll === undefined) {
    return formatToolResponse('error', 'catchAll must be specified (true or false) to update mail address');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await updateMailAddressCatchAll({
      mailAddressId: args.id,
      active: args.catchAll!,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      `Successfully updated mail address: ${args.id}`,
      {
        id: args.id,
        updated: true,
        catchAll: args.catchAll,
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

    logger.error('[WP06] Unexpected error in mail address update handler', { error });
    return formatToolResponse('error', `Failed to update mail address: ${error instanceof Error ? error.message : String(error)}`);
  }
};
