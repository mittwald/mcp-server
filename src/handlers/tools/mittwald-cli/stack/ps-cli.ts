import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldStackPsCliArgs {
  stackId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

type RawService = {
  id?: string;
  name?: string;
  state?: string;
  image?: string;
  ports?: unknown;
  stackId?: string;
  createdAt?: string;
  updatedAt?: string;
};

function buildCliArgs(args: MittwaldStackPsCliArgs): string[] {
  const cliArgs: string[] = ['stack', 'ps', '--output', 'json'];

  if (args.stackId) cliArgs.push('--stack-id', args.stackId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function parseJsonOutput(output: string): RawService[] | undefined {
  if (!output) return undefined;

  try {
    const data = JSON.parse(output);
    return Array.isArray(data) ? data : undefined;
  } catch {
    return undefined;
  }
}

function mapCliError(error: CliToolError, args: MittwaldStackPsCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('stack')) {
    return `Stack not found: ${args.stackId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

function formatServices(services: RawService[]) {
  return services.map((service) => ({
    id: service.id,
    name: service.name,
    state: service.state,
    image: service.image,
    ports: service.ports ?? [],
    stackId: service.stackId,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  }));
}

export const handleStackPsCli: MittwaldCliToolHandler<MittwaldStackPsCliArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_stack_ps',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const parsed = parseJsonOutput(stdout);

    if (!parsed) {
      return formatToolResponse(
        'success',
        'Stack services retrieved (raw output)',
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
        'No services found in the stack',
        [],
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Found ${parsed.length} service${parsed.length === 1 ? '' : 's'} in the stack`,
      formatServices(parsed),
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
