import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { updateSshUser, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldSshUserUpdateArgs {
  sshUserId: string;
  quiet?: boolean;
  expires?: string;
  description?: string;
  publicKey?: string;
  password?: string;
  enable?: boolean;
  disable?: boolean;
}

function collectUpdatedFields(args: MittwaldSshUserUpdateArgs): string[] {
  const fields: string[] = [];
  if (args.description) fields.push('description');
  if (args.expires) fields.push('expires');
  if (args.publicKey) fields.push('public key');
  if (args.password) fields.push('password');
  if (args.enable) fields.push('enabled');
  if (args.disable) fields.push('disabled');
  return fields;
}

export const handleSshUserUpdateCli: MittwaldCliToolHandler<MittwaldSshUserUpdateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  if (!args.sshUserId) {
    return formatToolResponse('error', 'SSH user ID is required to update an SSH user');
  }

  if (args.enable && args.disable) {
    return formatToolResponse('error', 'Cannot specify both --enable and --disable flags');
  }

  if (args.publicKey && args.password) {
    return formatToolResponse('error', 'Cannot specify both --public-key and --password (they are mutually exclusive)');
  }

  const updatedFields = collectUpdatedFields(args);

  try {
    await updateSshUser({
      sshUserId: args.sshUserId,
      description: args.description,
      active: args.enable ? true : args.disable ? false : undefined,
      apiToken: session.mittwaldAccessToken,
    });

    if (args.quiet) {
      return formatToolResponse(
        'success',
        args.sshUserId,
        {
          sshUserId: args.sshUserId,
          action: 'updated',
          updatedFields,
        }
      );
    }

    return formatToolResponse(
      'success',
      `SSH user ${args.sshUserId} updated successfully`,
      {
        sshUserId: args.sshUserId,
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

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
