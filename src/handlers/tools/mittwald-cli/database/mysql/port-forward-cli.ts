import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';

interface MittwaldDatabaseMysqlPortForwardArgs {
  databaseId: string;
  quiet?: boolean;
  sshUser?: string;
  sshIdentityFile?: string;
  port?: number;
}

function quote(value: string): string {
  return value.includes(' ') ? `"${value}"` : value;
}

function buildCliCommand(args: MittwaldDatabaseMysqlPortForwardArgs): { command: string; localPort: number } {
  const cliArgs: string[] = ['mw', 'database', 'mysql', 'port-forward', args.databaseId];

  if (args.quiet) cliArgs.push('--quiet');
  if (args.sshUser) cliArgs.push('--ssh-user', quote(args.sshUser));
  if (args.sshIdentityFile) cliArgs.push('--ssh-identity-file', quote(args.sshIdentityFile));
  if (args.port && args.port !== 3306) cliArgs.push('--port', String(args.port));

  const localPort = args.port ?? 3306;
  return { command: cliArgs.join(' '), localPort };
}

function buildInstructions(command: string, databaseId: string, localPort: number, args: MittwaldDatabaseMysqlPortForwardArgs): string {
  return `LONG-RUNNING COMMAND: MySQL Port Forward

The port forward command creates a persistent SSH tunnel that forwards MySQL traffic to your local machine.

To start port forwarding for your MySQL database, please run the following command in your terminal:

${command}

This will:
1. Establish an SSH connection to your hosting environment
2. Forward MySQL traffic from database ${databaseId} to local port ${localPort}
3. Keep the connection open until you stop the command (Ctrl+C)

USAGE AFTER STARTING:
Once the port forwarding is active, you can connect to your MySQL database using any MySQL client:

mysql -h 127.0.0.1 -P ${localPort} -u [username] -p [database_name]

Or with connection strings:
mysql://username:password@127.0.0.1:${localPort}/database_name

ENVIRONMENT VARIABLES:
${args.sshUser ? `- MITTWALD_SSH_USER: ${args.sshUser}` : '- MITTWALD_SSH_USER: Override SSH user if needed'}
${args.sshIdentityFile ? `- MITTWALD_SSH_IDENTITY_FILE: ${args.sshIdentityFile}` : '- MITTWALD_SSH_IDENTITY_FILE: Specify SSH private key if needed'}

TIPS:
- Keep the terminal window open while using the port forward
- Use Ctrl+C to stop the port forwarding
- Make sure port ${localPort} is available on your local machine
- The connection uses your SSH configuration from ~/.ssh/config`;
}

export const handleDatabaseMysqlPortForwardCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlPortForwardArgs> = async (args) => {
  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required.');
  }

  try {
    const { command, localPort } = buildCliCommand(args);
    const instructions = buildInstructions(command, args.databaseId, localPort, args);

    return formatToolResponse(
      'success',
      'MySQL port forward command prepared',
      {
        command,
        databaseId: args.databaseId,
        localPort,
        longRunning: true,
        connectionString: `mysql://username:password@127.0.0.1:${localPort}/database_name`,
        instructions,
        environmentVariables: {
          ...(args.sshUser && { MITTWALD_SSH_USER: args.sshUser }),
          ...(args.sshIdentityFile && { MITTWALD_SSH_IDENTITY_FILE: args.sshIdentityFile }),
        },
      },
      {
        command,
        durationMs: null,
      }
    );
  } catch (error) {
    return formatToolResponse(
      'error',
      `Failed to prepare MySQL port forward command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
