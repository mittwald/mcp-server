import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';

interface MittwaldDatabaseMysqlPortForwardArgs {
  databaseId: string;
  sshUser?: string;
  sshIdentityFile?: string;
  port?: number;
}

export const handleDatabaseMysqlPortForwardCli: MittwaldToolHandler<MittwaldDatabaseMysqlPortForwardArgs> = async (args) => {
  try {
    // Build CLI command for user to execute
    const cliArgs: string[] = ['mw', 'database', 'mysql', 'port-forward'];
    
    // Required database ID
    cliArgs.push(args.databaseId);
    
    // Optional flags
    
    if (args.sshUser) {
      cliArgs.push('--ssh-user', `"${args.sshUser}"`);
    }
    
    if (args.sshIdentityFile) {
      cliArgs.push('--ssh-identity-file', `"${args.sshIdentityFile}"`);
    }
    
    if (args.port && args.port !== 3306) {
      cliArgs.push('--port', args.port.toString());
    }
    
    const commandToExecute = cliArgs.join(' ');
    const localPort = args.port || 3306;
    
    // Since this is a long-running port forwarding command, we cannot execute it directly
    // Instead, we provide the user with the command to run
    const instructions = `
LONG-RUNNING COMMAND: MySQL Port Forward

The port forward command creates a persistent SSH tunnel that forwards MySQL traffic to your local machine.

To start port forwarding for your MySQL database, please run the following command in your terminal:

${commandToExecute}

This will:
1. Establish an SSH connection to your hosting environment
2. Forward MySQL traffic from database ${args.databaseId} to local port ${localPort}
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
- The connection uses your SSH configuration from ~/.ssh/config
`;

    return formatToolResponse(
      "success",
      "MySQL port forward command prepared",
      {
        command: commandToExecute,
        databaseId: args.databaseId,
        localPort: localPort,
        longRunning: true,
        connectionString: `mysql://username:password@127.0.0.1:${localPort}/database_name`,
        instructions: instructions.trim(),
        environmentVariables: {
          MITTWALD_API_TOKEN: "Required for authentication",
          ...(args.sshUser && { MITTWALD_SSH_USER: args.sshUser }),
          ...(args.sshIdentityFile && { MITTWALD_SSH_IDENTITY_FILE: args.sshIdentityFile })
        }
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to prepare MySQL port forward command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};