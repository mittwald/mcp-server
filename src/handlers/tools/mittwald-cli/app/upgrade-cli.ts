import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldAppUpgradeArgs {
  installationId?: string;
  targetVersion?: string;
  force?: boolean;
  projectId?: string;
  wait?: boolean;
  waitTimeout?: string;
}

function buildCliArgs(args: MittwaldAppUpgradeArgs, installationId: string): string[] {
  const cliArgs: string[] = ['app', 'upgrade', installationId];

  if (args.targetVersion) cliArgs.push('--target-version', args.targetVersion);
  if (args.force) cliArgs.push('--force');
  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.wait) cliArgs.push('--wait');
  if (args.waitTimeout) cliArgs.push('--wait-timeout', args.waitTimeout);

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldAppUpgradeArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('installation')) {
    return `App installation not found. Please verify the installation ID: ${args.installationId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('not found') && combined.includes('version')) {
    return `Target version not found. Please verify the target version: ${args.targetVersion ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('cancelled') || combined.includes('canceled') || combined.includes('abort')) {
    return `Upgrade operation was cancelled. Use --force flag to skip confirmation.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

function formatSuccessMessage(args: MittwaldAppUpgradeArgs, installationId: string): { message: string; data: Record<string, unknown> } {
  const baseData: Record<string, unknown> = {
    installationId,
    targetVersion: args.targetVersion,
    projectId: args.projectId,
    force: args.force,
    wait: args.wait,
  };

  const message = args.wait
    ? `App upgrade completed successfully for installation ${installationId}`
    : `App upgrade started for installation ${installationId}`;

  return {
    message,
    data: baseData,
  };
}


export const handleAppUpgradeCli: MittwaldCliToolHandler<MittwaldAppUpgradeArgs> = async (args) => {
  if (!args.installationId) {
    return formatToolResponse('error', 'Installation ID is required. Please provide the installationId parameter.');
  }

  const argv = buildCliArgs(args, args.installationId);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_upgrade',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
      cliOptions: {
        timeout: 900000,
        env: {
          MITTWALD_NONINTERACTIVE: '1',
        },
      },
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || 'App upgraded successfully';

    const { message, data } = formatSuccessMessage(args, args.installationId);

    return formatToolResponse(
      'success',
      message,
      {
        ...data,
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
