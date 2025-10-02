import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldDdevRenderConfigArgs {
  appInstallationId: string;
  force?: boolean;
}

function buildCliArgs(args: MittwaldDdevRenderConfigArgs): string[] {
  const cliArgs: string[] = ['ddev', 'render-config', args.appInstallationId];
  if (args.force) cliArgs.push('--force');
  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldDdevRenderConfigArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('not found')) {
    return `App installation not found: ${args.appInstallationId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (combined.includes('already exists') && !args.force) {
    return `Configuration already exists. Use --force to overwrite.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return `DDEV render-config failed: ${error.stderr || error.stdout || error.message}`;
}

function parseConfigPath(output: string): string | null {
  const match = output.match(/Generated configuration file: (.+)/);
  return match ? match[1] : null;
}

export const handleDdevRenderConfigCli: MittwaldCliToolHandler<MittwaldDdevRenderConfigArgs> = async (args) => {
  if (!args.appInstallationId) {
    return formatToolResponse('error', 'app-installation-id is required');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_ddev_render_config',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const configPath = parseConfigPath(stdout);

    return formatToolResponse(
      'success',
      'DDEV configuration rendered successfully',
      {
        success: true,
        message: 'DDEV configuration rendered successfully',
        configPath,
        output: stdout || null,
        timestamp: new Date().toISOString(),
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
