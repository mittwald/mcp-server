import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldAppUninstallArgs {
  installationId?: string;
  quiet?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldAppUninstallArgs, installationId: string): string[] {
  const cliArgs: string[] = ['app', 'uninstall', installationId];

  if (args.quiet) cliArgs.push('--quiet');
  if (args.force) cliArgs.push('--force');

  return cliArgs;
}

function mapCliError(error: CliToolError, installationId: string): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('installation')) {
    return `App installation not found. Please verify the installation ID: ${installationId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('cancelled') || combined.includes('canceled') || combined.includes('abort')) {
    return `Uninstall operation was cancelled. Use the --force flag to skip confirmation prompts.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleAppUninstallCli: MittwaldCliToolHandler<MittwaldAppUninstallArgs> = async (args) => {
  if (!args.installationId) {
    return formatToolResponse('error', 'Installation ID is required. Please provide the installationId parameter.');
  }

  const argv = buildCliArgs(args, args.installationId);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_uninstall',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
      cliOptions: {
        env: {
          MITTWALD_NONINTERACTIVE: '1',
        },
      },
    });

    const output = result.result.stdout || result.result.stderr || 'App uninstalled successfully';

    return formatToolResponse(
      'success',
      'App uninstalled successfully',
      {
        installationId: args.installationId,
        force: args.force,
        quiet: args.quiet,
        output,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args.installationId);
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
