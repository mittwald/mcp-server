import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { parseJsonOutput } from '../../../../../utils/cli-output.js';

interface MittwaldDatabaseMysqlShellArgs {
  databaseId: string;
  sshUser?: string;
  sshIdentityFile?: string;
  mysqlPassword?: string;
  mysqlCharset?: string;
}

interface MysqlDatabaseMetadata {
  id?: string;
  name?: string;
  hostname?: string;
  characterSettings?: { characterSet?: string };
  projectId?: string;
  [key: string]: unknown;
}

function quote(value: string): string {
  return value.includes(' ') ? `"${value}"` : value;
}

function buildRecommendedCommand(args: MittwaldDatabaseMysqlShellArgs): string {
  const cliArgs: string[] = ['mw', 'database', 'mysql', 'shell', args.databaseId];

  if (args.sshUser) cliArgs.push('--ssh-user', quote(args.sshUser));
  if (args.sshIdentityFile) cliArgs.push('--ssh-identity-file', quote(args.sshIdentityFile));
  if (args.mysqlPassword) cliArgs.push('--mysql-password', quote(args.mysqlPassword));
  if (args.mysqlCharset) cliArgs.push('--mysql-charset', args.mysqlCharset);

  return cliArgs.join(' ');
}

function parseDatabaseMetadata(stdout: string): MysqlDatabaseMetadata {
  const parsed = parseJsonOutput(stdout);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Unexpected CLI output when fetching database metadata.');
  }

  return parsed as MysqlDatabaseMetadata;
}

async function fetchDatabaseMetadata(databaseId: string) {
  return invokeCliTool<MysqlDatabaseMetadata>({
    toolName: 'mittwald_database_mysql_shell',
    argv: ['database', 'mysql', 'get', databaseId, '--output', 'json'],
    parser: parseDatabaseMetadata,
  });
}

function buildInstructions(
  command: string,
  databaseId: string,
  args: MittwaldDatabaseMysqlShellArgs,
  metadata: MysqlDatabaseMetadata
): string {
  const databaseLabel = typeof metadata.name === 'string' && metadata.name
    ? `${metadata.name} (${databaseId})`
    : databaseId;

  return `INTERACTIVE COMMAND: MySQL Shell

The MySQL shell command opens an interactive session that cannot be executed directly through the MCP interface.

To connect to your MySQL database interactively, run the following command in your terminal:

${command}

This will:
1. Establish an SSH connection to your hosting environment
2. Connect to the MySQL database ${databaseLabel}
3. Open an interactive MySQL shell where you can run SQL commands

AUTHENTICATION:
- Ensure you are authenticated with the Mittwald CLI (run 'mw login' if needed)

ENVIRONMENT VARIABLES (optional):
${args.mysqlPassword ? '- MYSQL_PWD: Password will be passed via environment' : '- MYSQL_PWD: Set this to avoid interactive password prompts'}
${args.sshUser ? `- MITTWALD_SSH_USER: ${args.sshUser}` : '- MITTWALD_SSH_USER: Override SSH user if needed'}
${args.sshIdentityFile ? `- MITTWALD_SSH_IDENTITY_FILE: ${args.sshIdentityFile}` : '- MITTWALD_SSH_IDENTITY_FILE: Specify SSH private key if needed'}

TIPS:
- Use 'exit' or 'quit' to leave the MySQL shell
- The connection respects your SSH configuration in ~/.ssh/config
- For security, prefer environment variables instead of command-line flags for passwords`;
}

function mapCliError(error: CliToolError, databaseId: string): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('forbidden') || combined.includes('permission')) {
    return `Permission denied when accessing database ${databaseId}. Verify your access rights and ensure you are authenticated with the Mittwald CLI.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    return `Database not found. Please verify the database ID: ${databaseId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return error.message;
}

export const handleDatabaseMysqlShellCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlShellArgs> = async (args) => {
  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required.');
  }

  const recommendedCommand = buildRecommendedCommand(args);

  try {
    const metadataResult = await fetchDatabaseMetadata(args.databaseId);
    const metadata = metadataResult.result;
    const instructions = buildInstructions(recommendedCommand, args.databaseId, args, metadata);

    const databaseName = typeof metadata.name === 'string' ? metadata.name : undefined;
    const detectedCharset = metadata.characterSettings && typeof metadata.characterSettings === 'object'
      ? (metadata.characterSettings.characterSet as string | undefined)
      : undefined;

    return formatToolResponse(
      'success',
      'MySQL shell connection command prepared',
      {
        command: recommendedCommand,
        databaseId: args.databaseId,
        databaseName,
        charset: args.mysqlCharset ?? detectedCharset,
        interactive: true,
        instructions,
        environmentVariables: {
          ...(args.mysqlPassword && { MYSQL_PWD: 'Password for MySQL user' }),
          ...(args.sshUser && { MITTWALD_SSH_USER: args.sshUser }),
          ...(args.sshIdentityFile && { MITTWALD_SSH_IDENTITY_FILE: args.sshIdentityFile }),
        },
      },
      {
        command: metadataResult.meta.command,
        durationMs: metadataResult.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args.databaseId);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse(
      'error',
      `Failed to prepare MySQL shell command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
