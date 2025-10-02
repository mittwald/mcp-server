import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldAppUpdateArgs {
  installationId?: string;
  description?: string;
  entrypoint?: string;
  documentRoot?: string;
}

function buildCliArgs(args: MittwaldAppUpdateArgs, installationId: string): string[] {
  const cliArgs: string[] = ['app', 'update', installationId];

  if (args.description) cliArgs.push('--description', args.description);
  if (args.entrypoint) cliArgs.push('--entrypoint', args.entrypoint);
  if (args.documentRoot) cliArgs.push('--document-root', args.documentRoot);

  return cliArgs;
}

function mapCliError(error: CliToolError, installationId: string): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('installation')) {
    return `App installation not found. Please verify the installation ID: ${installationId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('not supported')) {
    return `Update operation not supported for this app type. Check the app documentation for supported update fields.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

function buildUpdates(args: MittwaldAppUpdateArgs): string[] {
  const updates: string[] = [];
  if (args.description) updates.push(`description: ${args.description}`);
  if (args.entrypoint) updates.push(`entrypoint: ${args.entrypoint}`);
  if (args.documentRoot) updates.push(`document root: ${args.documentRoot}`);
  return updates;
}

export const handleAppUpdateCli: MittwaldCliToolHandler<MittwaldAppUpdateArgs> = async (args) => {
  if (!args.installationId) {
    return formatToolResponse('error', 'Installation ID is required. Please provide the installationId parameter.');
  }

  if (!args.description && !args.entrypoint && !args.documentRoot) {
    return formatToolResponse('error', 'At least one update parameter is required (description, entrypoint, or documentRoot).');
  }

  const argv = buildCliArgs(args, args.installationId);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_update',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
      cliOptions: {
        env: {
          MITTWALD_NONINTERACTIVE: '1',
        },
      },
    });

    const output = result.result.stdout || result.result.stderr || 'App updated successfully';

    return formatToolResponse(
      'success',
      'App updated successfully',
      {
        installationId: args.installationId,
        updates: buildUpdates(args),
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
