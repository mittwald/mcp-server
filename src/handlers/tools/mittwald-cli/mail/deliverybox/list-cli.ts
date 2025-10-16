import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '../../../../../utils/cli-output.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldMailDeliveryboxListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldMailDeliveryboxListArgs): { argv: string[]; outputFormat: Required<MittwaldMailDeliveryboxListArgs>['output'] } {
  const outputFormat = args.output ?? 'txt';
  const argv: string[] = ['mail', 'deliverybox', 'list', '--output', outputFormat];

  if (args.projectId) argv.push('--project-id', args.projectId);
  if (args.extended) argv.push('--extended');
  if (args.noHeader) argv.push('--no-header');
  if (args.noTruncate) argv.push('--no-truncate');
  if (args.noRelativeDates) argv.push('--no-relative-dates');
  if (args.csvSeparator) argv.push('--csv-separator', args.csvSeparator);

  return { argv, outputFormat };
}

function mapCliError(error: CliToolError, args: MittwaldMailDeliveryboxListArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
    return `Permission denied when listing delivery boxes. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorMessage}`;
  }

  if (combined.includes('no default project')) {
    return `No default project set. Please provide --project-id or set a default project context.\nError: ${errorMessage}`;
  }

  return `Failed to list delivery boxes: ${errorMessage}`;
}

export const handleMittwaldMailDeliveryboxListCli: MittwaldCliToolHandler<MittwaldMailDeliveryboxListArgs> = async (args) => {
  const { argv, outputFormat } = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_mail_deliverybox_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr;

    if (outputFormat === 'json') {
      try {
        const deliveryBoxes = parseJsonOutput(stdout);
        const count = Array.isArray(deliveryBoxes) ? deliveryBoxes.length : null;

        return formatToolResponse(
          'success',
          `Retrieved ${count ?? 'unknown count'} delivery boxes`,
          {
            format: 'json',
            deliveryBoxes,
            count,
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return formatToolResponse(
          'success',
          'Retrieved delivery boxes',
          {
            format: 'json',
            content: stdout,
            parseError: message,
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }
    }

    return formatToolResponse(
      'success',
      'Retrieved delivery boxes',
      {
        format: outputFormat,
        content: output,
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

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
