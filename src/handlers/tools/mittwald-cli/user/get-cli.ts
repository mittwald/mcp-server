import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getUser, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldUserGetArgs {
  userId?: string;
  output?: 'txt' | 'json' | 'yaml';
}

interface RawUserProfile {
  userId?: string;
  email?: string;
  person?: {
    firstName?: string;
    lastName?: string;
    [key: string]: unknown;
  };
  phoneNumber?: string;
  registeredAt?: string;
  mfa?: {
    active?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const handleUserGetCli: MittwaldCliToolHandler<MittwaldUserGetArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const userId = args.userId && args.userId.trim() ? args.userId : 'self';

  try {
    const result = await getUser({
      userId: args.userId,
      apiToken: session.mittwaldAccessToken,
    });

    const user = result.data as RawUserProfile;
    const outputFormat = args.output ?? 'txt';

    let formattedOutput: string;
    switch (outputFormat) {
      case 'json':
        formattedOutput = JSON.stringify(user, null, 2);
        break;
      case 'yaml':
        formattedOutput = Object.entries(user)
          .map(([key, value]) => {
            if (value && typeof value === 'object') {
              return `${key}: ${JSON.stringify(value)}`;
            }
            return `${key}: ${value ?? 'null'}`;
          })
          .join('\n');
        break;
      case 'txt':
      default:
        const firstName = user.person?.firstName ?? 'N/A';
        const lastName = user.person?.lastName ?? 'N/A';
        const mfaActive = user.mfa?.active ? 'Yes' : 'No';
        formattedOutput = [
          'User Profile:',
          `ID: ${user.userId ?? 'N/A'}`,
          `Email: ${user.email ?? 'N/A'}`,
          `First Name: ${firstName}`,
          `Last Name: ${lastName}`,
          `Phone: ${user.phoneNumber ?? 'N/A'}`,
          `Registered: ${user.registeredAt ?? 'N/A'}`,
          `MFA Active: ${mfaActive}`,
        ].join('\n');
        break;
    }

    return formatToolResponse(
      'success',
      `User details for ${userId}:`,
      {
        user,
        formattedOutput,
        format: outputFormat,
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

    logger.error('[WP06] Unexpected error in user get handler', { error });
    return formatToolResponse('error', `Failed to get user: ${error instanceof Error ? error.message : String(error)}`);
  }
};
