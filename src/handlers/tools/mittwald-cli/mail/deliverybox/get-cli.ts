import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '../../../../../utils/cli-wrapper.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldMailDeliveryboxGetArgs {
  id: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldMailDeliveryboxGetArgs): { argv: string[]; format: Required<MittwaldMailDeliveryboxGetArgs>['output'] } {
  const format = args.output ?? 'txt';
  const argv: string[] = ['mail', 'deliverybox', 'get', args.id, '--output', format];
  return { argv, format };
}

function mapCliError(error: CliToolError, id: string): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
    return `Permission denied when getting delivery box. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    return `Delivery box not found: ${id}.\nError: ${errorMessage}`;
  }

  return `Failed to get delivery box: ${errorMessage}`;
}

export const handleMittwaldMailDeliveryboxGetCli: MittwaldCliToolHandler<MittwaldMailDeliveryboxGetArgs> = async (args) => {
  const { argv, format } = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_mail_deliverybox_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr;

    if (format === 'json') {
      try {
        const deliveryBox = parseJsonOutput(stdout);
        const description = typeof deliveryBox === 'object' && deliveryBox && 'description' in deliveryBox
          ? String((deliveryBox as Record<string, unknown>).description ?? args.id)
          : args.id;

        return formatToolResponse(
          'success',
          `Retrieved delivery box: ${description}`,
          {
            format: 'json',
            deliveryBox,
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
          `Retrieved delivery box: ${args.id}`,
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
      `Retrieved delivery box: ${args.id}`,
      {
        format,
        content: output,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args.id);
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
