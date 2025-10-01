import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';

interface MittwaldDatabaseMysqlShellArgs {
  databaseId: string;
  quiet?: boolean;
  sshUser?: string;
  sshIdentityFile?: string;
  mysqlPassword?: string;
  mysqlCharset?: string;
}

function quote(value: string): string {
  return value.includes(' ') ? `"${value}"` : value;
}

function buildCliCommand(args: MittwaldDatabaseMysqlShellArgs): string {
  const cliArgs: string[] = ['mw', 'database', 'mysql', 'shell', args.databaseId];

  if (args.quiet) cliArgs.push('--quiet');
  if (args.sshUser) cliArgs.push('--ssh-user', quote(args.sshUser));
  if (args.sshIdentityFile) cliArgs.push('--ssh-identity-file', quote(args.sshIdentityFile));
  if (args.mysqlPassword) cliArgs.push('--mysql-password', quote(args.mysqlPassword));
  if (args.mysqlCharset) cliArgs.push('--mysql-charset', args.mysqlCharset);

  return cliArgs.join(' ');
}

function buildInstructions(command: string, databaseId: string, args: MittwaldDatabaseMysqlShellArgs): string {
  return `INTERACTIVE COMMAND: MySQL Shell

The MySQL shell command opens an interactive session that cannot be executed directly through the MCP interface.

To connect to your MySQL database interactively, please run the following command in your terminal:

${command}

This will:
1. Establish an SSH connection to your hosting environment
2. Connect to the MySQL database with ID: ${databaseId}
3. Open an interactive MySQL shell where you can run SQL commands

AUTHENTICATION:
  - Ensure you are authenticated with the Mittwald CLI (run 'mw login' if needed)

ENVIRONMENT VARIABLES (optional):
${args.mysqlPassword ? '- MYSQL_PWD: Password will be passed via environment' : '- MYSQL_PWD: Set this to avoid interactive password prompt'}
${args.sshUser ? `- MITTWALD_SSH_USER: ${args.sshUser}` : '- MITTWALD_SSH_USER: Override SSH user if needed'}
${args.sshIdentityFile ? `- MITTWALD_SSH_IDENTITY_FILE: ${args.sshIdentityFile}` : '- MITTWALD_SSH_IDENTITY_FILE: Specify SSH private key if needed'}

TIPS:
- Use 'exit' or 'quit' to leave the MySQL shell
- The connection uses your SSH configuration from ~/.ssh/config
- For security, consider using environment variables instead of command-line flags for passwords`;
}

export const handleDatabaseMysqlShellCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlShellArgs> = async (args) => {
  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required.');
  }

  try {
    const commandToExecute = buildCliCommand(args);
    const instructions = buildInstructions(commandToExecute, args.databaseId, args);

    return formatToolResponse(
      'success',
      'MySQL shell connection command prepared',
      {
        command: commandToExecute,
        databaseId: args.databaseId,
        interactive: true,
        instructions,
        environmentVariables: {
          ...(args.mysqlPassword && { MYSQL_PWD: 'Password for MySQL user' }),
          ...(args.sshUser && { MITTWALD_SSH_USER: args.sshUser }),
          ...(args.sshIdentityFile && { MITTWALD_SSH_IDENTITY_FILE: args.sshIdentityFile }),
        },
      },
      {
        command: commandToExecute,
        durationMs: null,
      }
    );
  } catch (error) {
    return formatToolResponse(
      'error',
      `Failed to prepare MySQL shell command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
