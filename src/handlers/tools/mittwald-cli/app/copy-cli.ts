import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldAppCopyArgs {
  installationId?: string;
  description: string;
}


export const handleAppCopyCli: MittwaldCliToolHandler<MittwaldAppCopyArgs> = async (args) => {
  if (!args.installationId) {
    return formatToolResponse(
      'error',
      'Installation ID is required. Please provide the installationId parameter.'
    );
  }

  if (!args.description) {
    return formatToolResponse(
      'error',
      'Description is required. Please provide the description parameter.'
    );
  }

  const argv = ['app', 'copy', args.installationId, '--description', args.description];

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_copy',
      argv,
      parser: (stdout, raw) => {
        return {
          originalInstallationId: args.installationId!,
          description: args.description,
          output: stdout || raw.stderr,
          meta: raw,
        };
      },
    });

    const payload = result.result;
    const summary = payload.output || 'App copied successfully';

    return formatToolResponse('success', summary, {
      originalInstallationId: payload.originalInstallationId,
      description: payload.description,
      output: payload.output,
    }, {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    });
  } catch (error) {
    if (error instanceof CliToolError) {
      return formatToolResponse('error', error.message, {
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
