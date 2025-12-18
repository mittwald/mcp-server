import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { createMailAddress, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldMailAddressCreateArgs {
  address: string;
  projectId?: string;
  quiet?: boolean;
  catchAll?: boolean;
  enableSpamProtection?: boolean;
  quota?: string;
  password?: string;
  randomPassword?: boolean;
  forwardTo?: string[];
}

export const handleMittwaldMailAddressCreateCli: MittwaldCliToolHandler<MittwaldMailAddressCreateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.address) {
    return formatToolResponse('error', 'address is required');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  // Check for unsupported library features
  if (args.catchAll || args.enableSpamProtection !== undefined || args.quota || args.password || args.randomPassword) {
    logger.warn('[WP06] Create mail address: CLI-only features requested, falling back to CLI-only mode', {
      hasAdvancedFeatures: true,
      catchAll: args.catchAll,
      enableSpamProtection: args.enableSpamProtection,
      quota: args.quota,
      hasPassword: Boolean(args.password),
      randomPassword: args.randomPassword,
    });

    return formatToolResponse('error',
      'Advanced mail address options (catchAll, enableSpamProtection, quota, password, randomPassword) are not yet supported in library mode. ' +
      'Only basic mail address creation with forwardTo is currently available.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await createMailAddress({
      projectId: args.projectId!,
      address: args.address,
      forwardAddresses: args.forwardTo,
      apiToken: session.mittwaldAccessToken,
    });

    const addressData = result.data as any;
    const addressId = addressData?.id ?? 'unknown';

    return formatToolResponse(
      'success',
      `Successfully created mail address '${args.address}' with ID ${addressId}`,
      {
        id: addressId,
        address: args.address,
        ...(args.forwardTo ? { forwardTo: args.forwardTo } : {}),
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

    logger.error('[WP06] Unexpected error in mail address create handler', { error });
    return formatToolResponse('error', `Failed to create mail address: ${error instanceof Error ? error.message : String(error)}`);
  }
};
