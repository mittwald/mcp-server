import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldDatabaseMysqlDeleteArgs {
  databaseId: string;
  force?: boolean;
}

function buildCliArgs(args: MittwaldDatabaseMysqlDeleteArgs): string[] {
  const cliArgs: string[] = ['database', 'mysql', 'delete', args.databaseId];

  if (args.force) cliArgs.push('--force');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseMysqlDeleteArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const defaultMessage = `Failed to delete MySQL database: ${error.stderr || error.message}`;

  if (
    combined.includes('403') ||
    combined.includes('forbidden') ||
    combined.includes('permission denied')
  ) {
    return `Permission denied when deleting MySQL database. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    return `MySQL database not found. Please verify the database ID: ${args.databaseId}\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('cancelled') || combined.includes('aborted')) {
    return `Database deletion was cancelled. Use --force flag to skip confirmation.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('in use') || combined.includes('active connections')) {
    return `Cannot delete database - it may have active connections or be in use.\nError: ${error.stderr || error.message}`;
  }

  return defaultMessage;
}

export const handleDatabaseMysqlDeleteCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlDeleteArgs> = async (args) => {
  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_mysql_delete',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr;
    const message = `Successfully deleted MySQL database '${args.databaseId}'`;

    return formatToolResponse(
      'success',
      message,
      {
        databaseId: args.databaseId,
        deleted: true,
        output,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
