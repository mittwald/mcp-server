import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldAppOpenArgs {
  installationId?: string;
}

function buildCliArgs(installationId: string): string[] {
  return ['app', 'open', installationId];
}

function mapCliError(error: CliToolError, installationId: string): string {
  const stderr = (error.stderr || '').toLowerCase();
  const stdout = (error.stdout || '').toLowerCase();
  const combined = `${stdout}\n${stderr}`;

  if (combined.includes('not found') && combined.includes('installation')) {
    return `App installation not found. Please verify the installation ID: ${installationId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('virtual host')) {
    return `No virtual host linked to app installation. A virtual host is required to open the app in browser.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleAppOpenCli: MittwaldCliToolHandler<MittwaldAppOpenArgs> = async (args) => {
  if (!args.installationId) {
    return formatToolResponse('error', 'Installation ID is required. Please provide the installationId parameter.');
  }

  const argv = buildCliArgs(args.installationId);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_open',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
      cliOptions: {
        env: {
          MITTWALD_NONINTERACTIVE: '1',
        },
      },
    });

    const output = result.result.stdout || result.result.stderr || 'App opened in browser';

    return formatToolResponse(
      'success',
      'App opened in browser successfully',
      {
        installationId: args.installationId,
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
