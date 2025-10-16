import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '../../../../../utils/cli-output.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldMailAddressGetArgs {
  id: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldMailAddressGetArgs): { argv: string[]; format: Required<MittwaldMailAddressGetArgs>['output'] } {
  const format = args.output ?? 'txt';
  const argv: string[] = ['mail', 'address', 'get', args.id, '--output', format];
  return { argv, format };
}

function mapCliError(error: CliToolError, id: string): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
    return `Permission denied when getting mail address. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    return `Mail address not found: ${id}.\nError: ${errorMessage}`;
  }

  return `Failed to get mail address: ${errorMessage}`;
}

export const handleMittwaldMailAddressGetCli: MittwaldCliToolHandler<MittwaldMailAddressGetArgs> = async (args) => {
  const { argv, format } = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_mail_address_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr;

    if (format === 'json') {
      try {
        const mailAddress = parseJsonOutput(stdout);
        const label = typeof mailAddress === 'object' && mailAddress && 'address' in mailAddress
          ? String((mailAddress as Record<string, unknown>).address ?? args.id)
          : args.id;

        return formatToolResponse(
          'success',
          `Retrieved mail address: ${label}`,
          {
            format: 'json',
            mailAddress,
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
          `Retrieved mail address: ${args.id}`,
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
      `Retrieved mail address: ${args.id}`,
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
