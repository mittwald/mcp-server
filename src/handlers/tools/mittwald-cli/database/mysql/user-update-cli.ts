import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { updateMysqlUser, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';
import { buildSecureToolResponse, buildUpdatedAttributes } from '../../../../../utils/credential-response.js';

interface MittwaldDatabaseMysqlUserUpdateArgs {
  userId: string;
  description?: string;
  accessLevel?: 'readonly' | 'full';
  password?: string;
  accessIpMask?: string;
  enableExternalAccess?: boolean;
  disableExternalAccess?: boolean;
  quiet?: boolean;
}

function hasUpdatePayload(args: MittwaldDatabaseMysqlUserUpdateArgs): boolean {
  return Boolean(
    args.description ||
      args.accessLevel ||
      args.password ||
      typeof args.enableExternalAccess === 'boolean' ||
      typeof args.disableExternalAccess === 'boolean' ||
      args.accessIpMask
  );
}

export const handleDatabaseMysqlUserUpdateCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlUserUpdateArgs> = async (
  args,
  sessionId,
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return buildSecureToolResponse('error', 'Session ID required');
  }

  if (!args.userId) {
    return buildSecureToolResponse('error', 'User ID is required to update a MySQL user.');
  }

  if (args.enableExternalAccess && args.disableExternalAccess) {
    return buildSecureToolResponse('error', 'enableExternalAccess and disableExternalAccess cannot both be true.');
  }

  if (!hasUpdatePayload(args)) {
    return buildSecureToolResponse(
      'error',
      'Provide at least one property to update (description, accessLevel, password, accessIpMask, or external access flags).'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return buildSecureToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await updateMysqlUser({
      userId: args.userId,
      description: args.description,
      password: args.password,
      apiToken: session.mittwaldAccessToken,
    });

    const updatedAttributes = buildUpdatedAttributes({
      description: args.description,
      accessLevel: args.accessLevel,
      accessIpMask: args.accessIpMask,
      externalAccess:
        args.enableExternalAccess === true
          ? 'enabled'
          : args.disableExternalAccess === true
            ? 'disabled'
            : undefined,
      password: typeof args.password === 'string' ? 'updated' : undefined,
    });

    return buildSecureToolResponse(
      'success',
      `Updated MySQL user ${args.userId}.`,
      {
        userId: args.userId,
        updatedAttributes,
      },
      {
        durationMs: result.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return buildSecureToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP06] Unexpected error in database mysql user update handler', { error });
    return buildSecureToolResponse('error', `Failed to update MySQL user: ${error instanceof Error ? error.message : String(error)}`);
  }
};
