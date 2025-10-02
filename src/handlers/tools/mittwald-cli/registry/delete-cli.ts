import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldRegistryDeleteCliArgs {
  registryId: string;
  quiet?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldRegistryDeleteCliArgs): string[] {
  const cliArgs: string[] = ['registry', 'delete', args.registryId];

  if (args.quiet) cliArgs.push('--quiet');
  if (args.force) cliArgs.push('--force');

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1);
}

function mapCliError(error: CliToolError, args: MittwaldRegistryDeleteCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('registry')) {
    return `Registry not found: ${args.registryId}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleRegistryDeleteCli: MittwaldCliToolHandler<MittwaldRegistryDeleteCliArgs> = async (args) => {
  if (!args.registryId) {
    return formatToolResponse('error', 'Registry ID is required. Please provide the registryId parameter.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_registry_delete',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || 'Registry deleted successfully';

    if (args.quiet) {
      const registryId = parseQuietOutput(stdout) ?? args.registryId;
      return formatToolResponse(
        'success',
        'Registry deleted successfully',
        {
          registryId,
          status: 'deleted',
          output,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      'Registry deletion completed',
      {
        registryId: args.registryId,
        status: 'deleted',
        output,
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
