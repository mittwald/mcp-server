import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldExtensionUninstallCliArgs {
  extensionInstanceId: string;
}

function mapCliError(error: CliToolError, extensionInstanceId: string): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('extension')) {
    return `Extension instance not found: ${extensionInstanceId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return `Failed to uninstall extension: ${error.stderr || error.stdout || error.message}`;
}

export const handleExtensionUninstallCli: MittwaldToolHandler<MittwaldExtensionUninstallCliArgs> = async (args) => {
  const cliArgs: string[] = ['extension', 'uninstall', args.extensionInstanceId];

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_extension_uninstall',
      argv: cliArgs,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';

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
      const message = mapCliError(error, args.extensionInstanceId);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
