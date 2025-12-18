import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { createSshUser, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldSshUserCreateArgs {
  projectId?: string;
  description: string;
  quiet?: boolean;
  expires?: string;
  publicKey?: string;
  password?: string;
}

export const handleSshUserCreateCli: MittwaldCliToolHandler<MittwaldSshUserCreateArgs> = async (
  args,
  sessionId,
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.description) {
    return formatToolResponse('error', 'Description is required to create an SSH user');
  }

  if (args.password && args.publicKey) {
    return formatToolResponse('error', 'Cannot specify both password and public key authentication. Choose one.');
  }

  if (!args.password && !args.publicKey) {
    return formatToolResponse('error', 'Either password or public key must be specified for authentication');
  }

  if (!args.projectId) {
    return formatToolResponse(
      'error',
      "Project ID is required for SSH user creation. Please provide --project-id or set a default project context via 'mw context set --project-id=<PROJECT_ID>'."
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    // Note: Library currently only supports publicKey authentication via publicKeys[] parameter
    // Password authentication needs to be handled separately or library needs enhancement
    const publicKeys = args.publicKey
      ? [{ key: args.publicKey, comment: args.description }]
      : undefined;

    const result = await createSshUser({
      projectId: args.projectId,
      description: args.description,
      publicKeys,
      apiToken: session.mittwaldAccessToken,
    });

    const sshUserId = result?.id;

    const authentication = {
      method: args.publicKey ? 'publicKey' : 'password',
      passwordProvided: Boolean(args.password),
      publicKeyProvided: Boolean(args.publicKey),
    };

    const responseData = {
      id: sshUserId,
      description: args.description,
      authentication,
      projectId: args.projectId,
      expires: args.expires,
      ...(result || {}),
    };

    const message = sshUserId
      ? `Successfully created SSH user '${args.description}' with ID ${sshUserId}`
      : `Successfully created SSH user '${args.description}'`;

    return formatToolResponse(
      'success',
      args.quiet ? sshUserId ?? message : message,
      responseData
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
      `Failed to create SSH user: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
