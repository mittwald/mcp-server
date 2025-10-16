import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '@/utils/cli-output.js';
import { invokeCliTool, CliToolError } from '@/tools/index.js';

interface MittwaldDatabaseMysqlListArgs {
  projectId?: string;
  output?: "txt" | "json" | "yaml" | "csv" | "tsv";
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldDatabaseMysqlListArgs): string[] {
  const cliArgs: string[] = ['database', 'mysql', 'list', '--output', 'json'];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseMysqlListArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const errorText = error.stderr || error.stdout || error.message;

  if (
    combined.includes('403') ||
    combined.includes('forbidden') ||
    combined.includes('permission denied')
  ) {
    return `Permission denied when accessing MySQL databases. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorText}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    if (args.projectId) {
      return `Project not found. Please verify the project ID: ${args.projectId}\nError: ${errorText}`;
    }
    return `Resource not found.\nError: ${errorText}`;
  }

  return `Failed to list MySQL databases: ${errorText}`;
}

export const handleDatabaseMysqlListCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlListArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_mysql_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';

    try {
      const data = parseJsonOutput(stdout);

      if (!Array.isArray(data)) {
        return formatToolResponse(
          'error',
          'Unexpected output format from CLI command'
        );
      }

      if (data.length === 0) {
        return formatToolResponse(
          'success',
          'No MySQL databases found',
          [],
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      const formattedData = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        projectId: item.projectId,
        status: item.status,
        version: item.version,
        charset: item.charset,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      return formatToolResponse(
        'success',
        `Found ${data.length} MySQL database(s)`,
        formattedData,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'MySQL databases retrieved (raw output)',
        {
          rawOutput: stdout,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }
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
