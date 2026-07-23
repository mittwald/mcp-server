import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { getMysqlConnection, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { buildSshCommand, SSH_USAGE_NOTE } from '../../../../../utils/ssh-command.js';
import { logger } from '../../../../../utils/logger.js';

const MYSQL_PORT = 3306;

interface MittwaldDatabaseMysqlPortForwardArgs {
  databaseId?: string;
  port?: number;
  sshUser?: string;
  sshIdentityFile?: string;
}

export const handleDatabaseMysqlPortForwardCli: MittwaldCliToolHandler<
  MittwaldDatabaseMysqlPortForwardArgs
> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required. Please provide the databaseId parameter.');
  }

  const localPort = args.port ?? MYSQL_PORT;
  if (!Number.isInteger(localPort) || localPort < 1 || localPort > 65535) {
    return formatToolResponse('error', `Invalid local port: ${args.port}. Must be an integer between 1 and 65535.`);
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await getMysqlConnection({
      databaseId: args.databaseId,
      sshUser: args.sshUser,
      apiToken: session.mittwaldAccessToken,
    });

    const { database, hostname, databaseUser, sshHost, sshUser } = result.data;

    const command = buildSshCommand({
      user: sshUser,
      host: sshHost,
      identityFile: args.sshIdentityFile,
      flags: ['-N', '-L', `${localPort}:${hostname}:${MYSQL_PORT}`],
    });

    const mysqlClientCommand = `mysql -h 127.0.0.1 -P ${localPort} -u ${databaseUser} -p ${database}`;

    return formatToolResponse(
      'success',
      `Port forwarding instructions for MySQL database ${database}`,
      {
        databaseId: result.data.databaseId,
        database,
        databaseUser,
        remoteHostname: hostname,
        remotePort: MYSQL_PORT,
        localPort,
        sshHost,
        sshUser,
        command,
        mysqlClientCommand,
        instructions:
          'Run the command below on your own machine to open the tunnel; this MCP server does not keep ' +
          'long-running tunnels open. The command stays in the foreground until you stop it with CTRL+C.\n\n' +
          `${command}\n\n` +
          `While the tunnel is open, connect to the database on 127.0.0.1:${localPort}, e.g.:\n\n` +
          `${mysqlClientCommand}\n\n` +
          'You will be prompted for the password of the MySQL user (the MCP server cannot read it back; ' +
          'reset it with mittwald_database_mysql_user_update if you do not know it).\n\n' +
          SSH_USAGE_NOTE,
      },
      { durationMs: result.durationMs }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('Unexpected error in MySQL port-forward handler', { error });
    return formatToolResponse(
      'error',
      `Failed to resolve port forwarding data: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
