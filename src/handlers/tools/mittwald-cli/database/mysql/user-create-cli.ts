import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { createMysqlUser, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';
import { buildSecureToolResponse } from '../../../../../utils/credential-response.js';
import { generateSecurePassword } from '../../../../../utils/credential-generator.js';

interface MittwaldDatabaseMysqlUserCreateArgs {
  databaseId: string;
  description?: string;
  username?: string;
  accessLevel?: 'readonly' | 'full';
  password?: string;
  enableExternalAccess?: boolean;
  accessIpMask?: string;
  quiet?: boolean;
}

export const handleDatabaseMysqlUserCreateCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlUserCreateArgs> = async (
  args,
  sessionId,
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return buildSecureToolResponse('error', 'Session ID required');
  }

  if (!args.databaseId) {
    return buildSecureToolResponse('error', 'Database ID is required to create a MySQL user.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return buildSecureToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  let password = args.password;
  let generatedPassword: string | undefined;

  if (!password) {
    const credential = generateSecurePassword();
    generatedPassword = credential.value;
    password = credential.value;
  }

  const passwordGenerated = Boolean(generatedPassword);

  let description: string;
  try {
    const label = args.description?.trim() || args.username?.trim();
    if (!label) {
      return buildSecureToolResponse('error', 'Description or username is required to create a MySQL user.');
    }
    description = label;
  } catch (buildError) {
    return buildSecureToolResponse('error', 'Error resolving user description');
  }

  try {
    const result = await createMysqlUser({
      databaseId: args.databaseId,
      accessLevel: args.accessLevel ?? 'full',
      description,
      password,
      accessIpMask: args.accessIpMask,
      externalAccess: args.enableExternalAccess,
      apiToken: session.mittwaldAccessToken,
    });

    const responseData = {
      ...result.data,
      passwordGenerated,
      generatedPassword,
    };

    const messagePieces = [`Created MySQL user`];
    if (passwordGenerated) {
      messagePieces.push('Generated a secure password for the user.');
    }

    return buildSecureToolResponse(
      'success',
      messagePieces.join(' '),
      responseData,
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

    logger.error('[WP06] Unexpected error in database mysql user create handler', { error });
    return buildSecureToolResponse('error', `Failed to create MySQL user: ${error instanceof Error ? error.message : String(error)}`);
  }
};
