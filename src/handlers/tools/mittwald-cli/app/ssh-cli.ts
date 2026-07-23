import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getAppSshConnection, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { buildSshCommand, SSH_USAGE_NOTE } from '../../../../utils/ssh-command.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldAppSshArgs {
  installationId?: string;
  sshUser?: string;
  sshIdentityFile?: string;
}

export const handleAppSshCli: MittwaldCliToolHandler<MittwaldAppSshArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.installationId) {
    return formatToolResponse('error', 'Installation ID is required. Please provide the installationId parameter.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await getAppSshConnection({
      installationId: args.installationId,
      sshUser: args.sshUser,
      apiToken: session.mittwaldAccessToken,
    });

    const { host, user, directory, appShortId } = result.data;
    const identityFile = args.sshIdentityFile;

    const command = buildSshCommand({ user, host, identityFile });
    const commandInDirectory = buildSshCommand({
      user,
      host,
      identityFile,
      remoteCommand: `cd ${directory} && exec $SHELL -l`,
    });
    const exampleCommand = buildSshCommand({
      user,
      host,
      identityFile,
      remoteCommand: `cd ${directory} && ls -la`,
    });

    return formatToolResponse(
      'success',
      `SSH connection data for app installation ${appShortId}`,
      {
        installationId: args.installationId,
        appShortId,
        host,
        user,
        port: 22,
        documentRoot: directory,
        command,
        commandInDocumentRoot: commandInDirectory,
        instructions:
          'Run the command below on your own machine to connect; this MCP server does not open SSH sessions.\n\n' +
          `${command}\n\n` +
          `To start directly in the app directory:\n\n${commandInDirectory}\n\n` +
          `To run a single command non-interactively:\n\n${exampleCommand}\n\n` +
          SSH_USAGE_NOTE,
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

    logger.error('Unexpected error in app ssh handler', { error });
    return formatToolResponse(
      'error',
      `Failed to resolve SSH connection data: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
