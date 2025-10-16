import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { parseJsonOutput } from '../../../../../utils/cli-output.js';

interface MittwaldDatabaseMysqlPortForwardArgs {
  databaseId: string;
  sshUser?: string;
  sshIdentityFile?: string;
  port?: number;
}

interface MysqlDatabaseMetadata {
  id?: string;
  name?: string;
  hostname?: string;
  projectId?: string;
  [key: string]: unknown;
}

function quote(value: string): string {
  return value.includes(' ') ? `"${value}"` : value;
}

function buildRecommendedCommand(args: MittwaldDatabaseMysqlPortForwardArgs): { command: string; localPort: number } {
  const cliArgs: string[] = ['mw', 'database', 'mysql', 'port-forward', args.databaseId];

  if (args.sshUser) cliArgs.push('--ssh-user', quote(args.sshUser));
  if (args.sshIdentityFile) cliArgs.push('--ssh-identity-file', quote(args.sshIdentityFile));
  if (args.port && args.port !== 3306) cliArgs.push('--port', String(args.port));

  const localPort = args.port ?? 3306;
  return { command: cliArgs.join(' '), localPort };
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
    toolName: 'mittwald_database_mysql_port_forward',
    argv: ['database', 'mysql', 'get', databaseId, '--output', 'json'],
    parser: parseDatabaseMetadata,
  });
}

function buildInstructions(
  command: string,
  databaseId: string,
  localPort: number,
  args: MittwaldDatabaseMysqlPortForwardArgs,
  metadata: MysqlDatabaseMetadata
): string {
  const databaseLabel = typeof metadata.name === 'string' && metadata.name
    ? `${metadata.name} (${databaseId})`
    : databaseId;

  return `LONG-RUNNING COMMAND: MySQL Port Forward

The port forward command creates a persistent SSH tunnel that forwards MySQL traffic to your local machine.

To start port forwarding for your MySQL database, run the following command in your terminal:

${command}

This will:
1. Establish an SSH connection to your hosting environment
2. Forward MySQL traffic from database ${databaseLabel} to local port ${localPort}
3. Keep the connection open until you stop the command (Ctrl+C)

USAGE AFTER STARTING:
Once the port forwarding is active, connect to MySQL using any client:

mysql -h 127.0.0.1 -P ${localPort} -u [username] -p [database]

Or with a connection string:
mysql://username:password@127.0.0.1:${localPort}/${metadata.name ?? 'database_name'}

ENVIRONMENT VARIABLES:
${args.sshUser ? `- MITTWALD_SSH_USER: ${args.sshUser}` : '- MITTWALD_SSH_USER: Override SSH user if needed'}
${args.sshIdentityFile ? `- MITTWALD_SSH_IDENTITY_FILE: ${args.sshIdentityFile}` : '- MITTWALD_SSH_IDENTITY_FILE: Specify SSH private key if needed'}

TIPS:
- Keep the terminal window open while using the port forward
- Use Ctrl+C to stop the port forwarding
- Ensure port ${localPort} is available on your local machine
- The connection respects your SSH configuration in ~/.ssh/config`;
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

export const handleDatabaseMysqlPortForwardCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlPortForwardArgs> = async (args) => {
  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required.');
  }

  const { command, localPort } = buildRecommendedCommand(args);

  try {
    const metadataResult = await fetchDatabaseMetadata(args.databaseId);
    const metadata = metadataResult.result;
    const instructions = buildInstructions(command, args.databaseId, localPort, args, metadata);

    const databaseName = typeof metadata.name === 'string' ? metadata.name : undefined;

    return formatToolResponse(
      'success',
      'MySQL port forward command prepared',
      {
        command,
        databaseId: args.databaseId,
        databaseName,
        localPort,
        longRunning: true,
        connectionString: `mysql://username:password@127.0.0.1:${localPort}/${databaseName ?? 'database_name'}`,
        instructions,
        environmentVariables: {
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
      `Failed to prepare MySQL port forward command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
