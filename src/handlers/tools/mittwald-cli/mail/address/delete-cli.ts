import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldMailAddressDeleteArgs {
  id: string;
  quiet?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldMailAddressDeleteArgs): string[] {
  const cliArgs: string[] = ['mail', 'address', 'delete', args.id];
  if (args.quiet) cliArgs.push('--quiet');
  if (args.force) cliArgs.push('--force');
  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
}

function mapCliError(error: CliToolError, args: MittwaldMailAddressDeleteArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
    return `Permission denied when deleting mail address. Check if your API token has mail management permissions.\nError: ${errorMessage}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    return `Mail address not found: ${args.id}.\nError: ${errorMessage}`;
  }

  if (combined.includes('cancelled') || combined.includes('canceled') || combined.includes('aborted')) {
    return `Delete operation cancelled. Use --force to delete without confirmation.\nError: ${errorMessage}`;
  }

  return `Failed to delete mail address: ${errorMessage}`;
}

export const handleMittwaldMailAddressDeleteCli: MittwaldCliToolHandler<MittwaldMailAddressDeleteArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_mail_address_delete',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr;

    const quietMessage = args.quiet ? parseQuietOutput(stdout) ?? output : undefined;

    return formatToolResponse(
      'success',
      args.quiet ? (quietMessage || 'Mail address deleted') : `Successfully deleted mail address: ${args.id}`,
      {
        id: args.id,
        deleted: true,
        output,
        force: args.force,
        quiet: args.quiet,
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
