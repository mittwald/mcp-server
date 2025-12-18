import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { parseQuietOutput } from '../../../../utils/cli-output.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldExtensionUninstallCliArgs {
  extensionInstanceId: string;
  quiet?: boolean;
}

export const handleExtensionUninstallCli: MittwaldCliToolHandler<MittwaldExtensionUninstallCliArgs> = async (
  args,
  sessionId
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const cliArgs = ['extension', 'uninstall', args.extensionInstanceId];
    if (args.quiet) cliArgs.push('--quiet');

    const result = await invokeCliTool({
      toolName: 'mittwald_extension_uninstall',
      argv: [...cliArgs, '--token', session.mittwaldAccessToken],
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = (result.result as any).stdout ?? '';
    const durationMs = result.meta.durationMs;

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
          durationMs,
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
        durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
      let message = `Failed to uninstall extension: ${error.stderr || error.stdout || error.message}`;

      if (combined.includes('not found') && combined.includes('extension')) {
        message = `Extension instance not found: ${args.extensionInstanceId}.\nError: ${error.stderr || error.stdout || error.message}`;
      }

      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP06] Unexpected error in extension uninstall handler', { error });
    return formatToolResponse(
      'error',
      `Failed to uninstall extension: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
