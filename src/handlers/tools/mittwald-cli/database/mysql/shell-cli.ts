import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';

interface MittwaldDatabaseMysqlShellArgs {
  databaseId: string;
  quiet?: boolean;
  sshUser?: string;
  sshIdentityFile?: string;
  mysqlPassword?: string;
  mysqlCharset?: string;
}

export const handleDatabaseMysqlShellCli: MittwaldToolHandler<MittwaldDatabaseMysqlShellArgs> = async (args) => {
  try {
    // Build CLI command for user to execute
    const cliArgs: string[] = ['mw', 'database', 'mysql', 'shell'];
    
    // Required database ID
    cliArgs.push(args.databaseId);
    
    // Optional flags
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    if (args.sshUser) {
      cliArgs.push('--ssh-user', `"${args.sshUser}"`);
    }
    
    if (args.sshIdentityFile) {
      cliArgs.push('--ssh-identity-file', `"${args.sshIdentityFile}"`);
    }
    
    if (args.mysqlPassword) {
      cliArgs.push('--mysql-password', `"${args.mysqlPassword}"`);
    }
    
    if (args.mysqlCharset) {
      cliArgs.push('--mysql-charset', args.mysqlCharset);
    }
    
    const commandToExecute = cliArgs.join(' ');
    
    // Since this is an interactive command, we cannot execute it directly
    // Instead, we provide the user with the command to run
    const instructions = `
INTERACTIVE COMMAND: MySQL Shell

The MySQL shell command opens an interactive session that cannot be executed directly through the MCP interface.

To connect to your MySQL database interactively, please run the following command in your terminal:

${commandToExecute}

This will:
1. Establish an SSH connection to your hosting environment
2. Connect to the MySQL database with ID: ${args.databaseId}
3. Open an interactive MySQL shell where you can run SQL commands

ENVIRONMENT VARIABLES:
${args.mysqlPassword ? '- MYSQL_PWD: Password will be passed via environment' : '- MYSQL_PWD: Set this to avoid interactive password prompt'}
${args.sshUser ? `- MITTWALD_SSH_USER: ${args.sshUser}` : '- MITTWALD_SSH_USER: Override SSH user if needed'}
${args.sshIdentityFile ? `- MITTWALD_SSH_IDENTITY_FILE: ${args.sshIdentityFile}` : '- MITTWALD_SSH_IDENTITY_FILE: Specify SSH private key if needed'}

TIPS:
- Use 'exit' or 'quit' to leave the MySQL shell
- The connection uses your SSH configuration from ~/.ssh/config
- For security, consider using environment variables instead of command-line flags for passwords
`;

    return formatToolResponse(
      "success",
      "MySQL shell connection command prepared",
      {
        command: commandToExecute,
        databaseId: args.databaseId,
        interactive: true,
        instructions: instructions.trim(),
        environmentVariables: {
          MITTWALD_API_TOKEN: "Required for authentication",
          ...(args.mysqlPassword && { MYSQL_PWD: "Password for MySQL user" }),
          ...(args.sshUser && { MITTWALD_SSH_USER: args.sshUser }),
          ...(args.sshIdentityFile && { MITTWALD_SSH_IDENTITY_FILE: args.sshIdentityFile })
        }
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to prepare MySQL shell command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};