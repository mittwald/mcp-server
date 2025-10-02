import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldAppListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldAppListArgs): string[] {
  const cliArgs: string[] = ['app', 'list'];

  // We always request JSON to simplify parsing; CLI ignores duplicate flags.
  cliArgs.push('--output', 'json');

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

type RawAppListItem = {
  id?: string;
  appId?: string;
  name?: string;
  version?: string;
  status?: string;
  createdAt?: string;
  projectId?: string;
};

function parseAppList(output: string): RawAppListItem[] | undefined {
  if (!output) return undefined;

  try {
    const data = JSON.parse(output);
    return Array.isArray(data) ? data : undefined;
  } catch {
    return undefined;
  }
}

function mapCliError(error: CliToolError, args: MittwaldAppListArgs): string {
  const stderr = (error.stderr || '').toLowerCase();

  if (stderr.includes('not found') && stderr.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleAppListCli: MittwaldCliToolHandler<MittwaldAppListArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const parsed = parseAppList(stdout);

    if (!parsed) {
      return formatToolResponse(
        'success',
        'Apps retrieved (raw output)',
        {
          rawOutput: stdout,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    if (parsed.length === 0) {
      return formatToolResponse(
        'success',
        'No apps found',
        [],
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const formatted = parsed.map((item) => ({
      id: item.id,
      appId: item.appId,
      name: item.name,
      version: item.version,
      status: item.status,
      createdAt: item.createdAt,
      projectId: item.projectId,
    }));

    return formatToolResponse(
      'success',
      `Found ${formatted.length} app(s)`,
      formatted,
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

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
