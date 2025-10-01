import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '../../../../../utils/cli-wrapper.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldDatabaseMysqlGetArgs {
  databaseId: string;
  output?: "txt" | "json" | "yaml";
}

function buildCliArgs(args: MittwaldDatabaseMysqlGetArgs): string[] {
  const outputFormat = args.output ?? 'json';
  return ['database', 'mysql', 'get', args.databaseId, '--output', outputFormat];
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseMysqlGetArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const errorText = error.stderr || error.stdout || error.message;

  if (
    combined.includes('403') ||
    combined.includes('forbidden') ||
    combined.includes('permission denied')
  ) {
    return `Permission denied when accessing MySQL database. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorText}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    return `MySQL database not found. Please verify the database ID: ${args.databaseId}\nError: ${errorText}`;
  }

  return `Failed to get MySQL database: ${errorText}`;
}

export const handleDatabaseMysqlGetCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlGetArgs> = async (args) => {
  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required.');
  }

  const outputFormat = args.output ?? 'json';
  const argv = buildCliArgs({ ...args, output: outputFormat });

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_mysql_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    if (outputFormat === 'json') {
      try {
        const database = parseJsonOutput(stdout);
        return formatToolResponse(
          'success',
          `Successfully retrieved MySQL database information for ${args.databaseId}`,
          database,
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      } catch (error) {
        return formatToolResponse(
          'error',
          `Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    const output = stdout || stderr;
    return formatToolResponse(
      'success',
      'MySQL database information retrieved successfully',
      output,
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
