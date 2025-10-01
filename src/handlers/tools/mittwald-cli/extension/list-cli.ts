import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldExtensionListCliArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldExtensionListCliArgs): string[] {
  const cliArgs: string[] = ['extension', 'list'];

  cliArgs.push('--output', 'json');

  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

type RawExtensionListItem = {
  id?: string;
  name?: string;
  context?: string;
  subTitle?: string;
  description?: string;
  scopes?: string[];
  tags?: string[];
};

function parseExtensionList(output: string): { items?: RawExtensionListItem[]; error?: string } {
  if (!output) return { items: [] };

  try {
    const data = parseJsonOutput(output);
    return Array.isArray(data) ? { items: data } : { error: 'Unexpected output format from CLI command' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function mapCliError(error: CliToolError): string {
  return `Failed to list extensions: ${error.stderr || error.stdout || error.message}`;
}

export const handleExtensionListCli: MittwaldCliToolHandler<MittwaldExtensionListCliArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_extension_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const { items, error: parseError } = parseExtensionList(stdout);

    if (!items) {
      return formatToolResponse(
        'success',
        'Extensions retrieved (raw output)',
        {
          rawOutput: stdout,
          stderr,
          parseError,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    if (items.length === 0) {
      return formatToolResponse(
        'success',
        'No extensions found',
        [],
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const formattedData = items.map((item) => ({
      id: item.id,
      name: item.name,
      context: item.context,
      subTitle: item.subTitle,
      description: item.description,
      scopes: item.scopes || [],
      tags: item.tags || [],
    }));

    return formatToolResponse(
      'success',
      `Found ${formattedData.length} extension(s)`,
      formattedData,
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
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
