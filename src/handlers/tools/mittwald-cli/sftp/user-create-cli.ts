import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { buildSecureToolResponse } from '../../../../utils/credential-response.js';
import { createSftpUser, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldSftpUserCreateArgs {
  projectId?: string;
  description: string;
  directories: string[];
  quiet?: boolean;
  expires?: string;
  publicKey?: string;
  password?: string;
  accessLevel?: 'read' | 'full';
}

export const handleSftpUserCreateCli: MittwaldCliToolHandler<MittwaldSftpUserCreateArgs> = async (
  args,
  sessionId,
) => {
  if (!args.description) {
    return buildSecureToolResponse('error', 'Description is required to create an SFTP user');
  }

  if (!args.directories || args.directories.length === 0) {
    return buildSecureToolResponse('error', 'At least one directory must be specified');
  }

  if (args.password && args.publicKey) {
    return buildSecureToolResponse('error', 'Cannot specify both password and public key authentication. Choose one.');
  }

  if (!args.password && !args.publicKey) {
    return buildSecureToolResponse('error', 'Either password or public key must be specified for authentication');
  }

  if (!args.projectId) {
    return buildSecureToolResponse('error', 'projectId is required');
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return buildSecureToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return buildSecureToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await createSftpUser({
      projectId: args.projectId,
      description: args.description,
      password: args.password,
      directories: (args.directories && args.directories.length > 0) ?
        (args.directories as [string, ...string[]]) : ['/'],
      apiToken: session.mittwaldAccessToken,
    });

    const sftpUserId = result?.id || result?.sftpUserId;

    const authentication = {
      method: args.publicKey ? 'publicKey' : 'password',
      passwordProvided: Boolean(args.password),
      publicKeyProvided: Boolean(args.publicKey),
    };

    const responseData = {
      id: sftpUserId,
      description: args.description,
      directories: args.directories,
      accessLevel: args.accessLevel ?? 'read',
      authentication,
      projectId: args.projectId,
      expires: args.expires,
    };

    const message = sftpUserId
      ? `Successfully created SFTP user '${args.description}' with ID ${sftpUserId}`
      : `Successfully created SFTP user '${args.description}'`;

    return buildSecureToolResponse(
      'success',
      args.quiet ? sftpUserId ?? message : message,
      responseData
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return buildSecureToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    return buildSecureToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
