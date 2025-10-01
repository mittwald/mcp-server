import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldStackListCliArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

type RawStack = {
  id?: string;
  description?: string;
  prefix?: string;
  services?: unknown;
  volumes?: unknown;
  disabled?: boolean;
  projectId?: string;
};

function buildCliArgs(args: MittwaldStackListCliArgs): string[] {
  const cliArgs: string[] = ['stack', 'list', '--output', 'json'];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function parseJsonOutput(output: string): RawStack[] | undefined {
  if (!output) return undefined;

  try {
    const data = JSON.parse(output);
    return Array.isArray(data) ? data : undefined;
  } catch {
    return undefined;
  }
}

function mapCliError(error: CliToolError, args: MittwaldStackListCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

function formatStacks(stacks: RawStack[]) {
  return stacks.map((stack) => ({
    id: stack.id,
    description: stack.description,
    prefix: stack.prefix,
    services: stack.services ?? [],
    volumes: stack.volumes ?? [],
    disabled: stack.disabled ?? false,
    projectId: stack.projectId,
  }));
}

export const handleStackListCli: MittwaldCliToolHandler<MittwaldStackListCliArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_container_stack_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const parsed = parseJsonOutput(stdout);

    if (!parsed) {
      return formatToolResponse(
        'success',
        'Container stacks retrieved (raw output)',
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
        'No container stacks found',
        [],
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Found ${parsed.length} container stack${parsed.length === 1 ? '' : 's'}`,
      formatStacks(parsed),
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
