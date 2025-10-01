import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldServerListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldServerListArgs): string[] {
  const cliArgs: string[] = ['server', 'list', '--output', 'json'];

  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator && args.output === 'csv') cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function mapCliError(error: CliToolError): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const details = stderr || stdout || error.message;
  return `Failed to list servers: ${details}`;
}

function formatServer(record: Record<string, unknown>) {
  return {
    id: record.id,
    description: record.description,
    createdAt: record.createdAt,
    isReady: record.isReady,
    status: record.status,
    data: record,
  };
}

export const handleServerListCli: MittwaldCliToolHandler<MittwaldServerListArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_server_list',
      argv,
      parser: (stdout) => stdout,
    });

    const commandMeta = {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    };

    const stdout = result.result ?? '';

    try {
      const parsed = JSON.parse(stdout);

      if (!Array.isArray(parsed)) {
        return formatToolResponse('error', 'Unexpected output format from CLI command');
      }

      if (parsed.length === 0) {
        return formatToolResponse('success', 'No servers found', [], commandMeta);
      }

      const formatted = parsed.map((item) => formatServer((item ?? {}) as Record<string, unknown>));

      return formatToolResponse(
        'success',
        `Found ${formatted.length} server(s)`,
        formatted,
        commandMeta
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Servers retrieved (raw output)',
        {
          rawOutput: stdout,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        },
        commandMeta
      );
    }
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
