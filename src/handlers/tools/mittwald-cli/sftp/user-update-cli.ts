import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { updateSftpUser, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldSftpUserUpdateArgs {
  sftpUserId: string;
  quiet?: boolean;
  expires?: string;
  description?: string;
  publicKey?: string;
  password?: string;
  accessLevel?: 'read' | 'full';
  directories?: string[];
  enable?: boolean;
  disable?: boolean;
}

export const handleSftpUserUpdateCli: MittwaldCliToolHandler<MittwaldSftpUserUpdateArgs> = async (args, sessionId) => {
  if (!args.sftpUserId) {
    return formatToolResponse('error', 'SFTP user ID is required to update an SFTP user');
  }

  if (args.enable && args.disable) {
    return formatToolResponse('error', 'Cannot specify both --enable and --disable flags');
  }

  if (args.publicKey && args.password) {
    return formatToolResponse('error', 'Cannot specify both --public-key and --password (they are mutually exclusive)');
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    await updateSftpUser({
      sftpUserId: args.sftpUserId,
      password: args.password,
      apiToken: session.mittwaldAccessToken,
    });

    const updatedFields: string[] = [];
    if (args.description) updatedFields.push('description');
    if (args.expires) updatedFields.push('expires');
    if (args.publicKey) updatedFields.push('public key');
    if (args.password) updatedFields.push('password');
    if (args.accessLevel) updatedFields.push('access level');
    if (args.directories?.length) updatedFields.push('directories');
    if (args.enable) updatedFields.push('enabled');
    if (args.disable) updatedFields.push('disabled');

    if (args.quiet) {
      return formatToolResponse(
        'success',
        args.sftpUserId,
        {
          sftpUserId: args.sftpUserId,
          action: 'updated',
        }
      );
    }

    return formatToolResponse(
      'success',
      `SFTP user ${args.sftpUserId} updated successfully`,
      {
        sftpUserId: args.sftpUserId,
        action: 'updated',
        updatedFields,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
