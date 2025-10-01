import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { parseQuietOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldExtensionUninstallCliArgs {
  extensionInstanceId: string;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldExtensionUninstallCliArgs): string[] {
  const cliArgs: string[] = ['extension', 'uninstall', args.extensionInstanceId];
  if (args.quiet) cliArgs.push('--quiet');
  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldExtensionUninstallCliArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('extension')) {
    return `Extension instance not found: ${args.extensionInstanceId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return `Failed to uninstall extension: ${error.stderr || error.stdout || error.message}`;
}

export const handleExtensionUninstallCli: MittwaldCliToolHandler<MittwaldExtensionUninstallCliArgs> = async (args) => {
  if (!args.extensionInstanceId) {
    return formatToolResponse('error', 'Extension instance ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_extension_uninstall',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';

    if (args.quiet) {
      const resultId = parseQuietOutput(stdout);
      return formatToolResponse(
        'success',
        'Extension uninstalled successfully',
        {
          extensionInstanceId: args.extensionInstanceId,
          status: 'uninstalled',
          resultId,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const successMessage = stdout || 'Extension uninstallation completed successfully';

    return formatToolResponse(
      'success',
      'Extension uninstallation completed',
      {
        extensionInstanceId: args.extensionInstanceId,
        status: 'uninstalled',
        output: successMessage,
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
