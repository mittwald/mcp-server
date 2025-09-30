import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldAppCopyArgs {
  installationId?: string;
  description: string;
  quiet?: boolean;
}

function parseQuietIdentifier(stdout: string): string | undefined {
  const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.at(-1);
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
  if (args.quiet) {
    argv.push('--quiet');
  }

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_copy',
      argv,
      parser: (stdout, raw) => {
        if (args.quiet) {
          const newId = parseQuietIdentifier(stdout);
          return {
            originalInstallationId: args.installationId!,
            newInstallationId: newId,
            description: args.description,
            quiet: true,
            rawOutput: stdout,
            meta: raw,
          };
        }

        return {
          originalInstallationId: args.installationId!,
          description: args.description,
          output: stdout || raw.stderr,
          quiet: false,
          meta: raw,
        };
      },
    });

    const payload = result.result;
    const summary = args.quiet
      ? 'App copied successfully'
      : (payload.output || 'App copied successfully');

    return formatToolResponse('success', summary, {
      originalInstallationId: payload.originalInstallationId,
      description: payload.description,
      ...(args.quiet
        ? { newInstallationId: payload.newInstallationId, quiet: true }
        : { output: payload.output, quiet: false }),
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
