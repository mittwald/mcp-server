import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { parseJsonOutput } from '../../../../../utils/cli-output.js';

interface MittwaldDatabaseMysqlPhpmyadminArgs {
  databaseId: string;
}

interface MysqlDatabaseMetadata {
  id?: string;
  name?: string;
  hostname?: string;
  projectId?: string;
  [key: string]: unknown;
}

function buildRecommendedCommand(args: MittwaldDatabaseMysqlPhpmyadminArgs): string {
  return ['mw', 'database', 'mysql', 'phpmyadmin', args.databaseId].join(' ');
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
    toolName: 'mittwald_database_mysql_phpmyadmin',
    argv: ['database', 'mysql', 'get', databaseId, '--output', 'json'],
    parser: parseDatabaseMetadata,
  });
}

function buildInstructions(
  command: string,
  databaseId: string,
  metadata: MysqlDatabaseMetadata
): string {
  const databaseLabel = typeof metadata.name === 'string' && metadata.name
    ? `${metadata.name} (${databaseId})`
    : databaseId;

  return `BROWSER COMMAND: phpMyAdmin

The phpMyAdmin command opens a web browser to access the phpMyAdmin interface for your MySQL database.

To open phpMyAdmin for your MySQL database, please run the following command in your terminal:

${command}

This will:
1. Authenticate with your Mittwald account
2. Generate a secure access URL for phpMyAdmin
3. Open your default web browser to the phpMyAdmin interface
4. Provide direct access to database ${databaseLabel}

NOTES:
- This command requires a web browser to be available
- Ensure you are authenticated with the Mittwald CLI (run 'mw login' if needed)
- The session is secure and tied to your authentication
- You can manage your database through the phpMyAdmin web interface

TIP:
- Make sure you have a web browser available on your system
- The phpMyAdmin session will be automatically authenticated`;
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

export const handleDatabaseMysqlPhpmyadminCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlPhpmyadminArgs> = async (args) => {
  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required.');
  }

  const recommendedCommand = buildRecommendedCommand(args);

  try {
    const metadataResult = await fetchDatabaseMetadata(args.databaseId);
    const metadata = metadataResult.result;
    const instructions = buildInstructions(recommendedCommand, args.databaseId, metadata);

    const databaseName = typeof metadata.name === 'string' ? metadata.name : undefined;

    return formatToolResponse(
      'success',
      'phpMyAdmin access command prepared',
      {
        command: recommendedCommand,
        databaseId: args.databaseId,
        databaseName,
        requiresBrowser: true,
        instructions,
        environmentVariables: {},
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
      `Failed to prepare phpMyAdmin command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
