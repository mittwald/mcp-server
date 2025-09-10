import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldAppUpgradeArgs {
  installationId?: string;
  targetVersion?: string;
  force?: boolean;
  projectId?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: string;
}

export const handleAppUpgradeCli: MittwaldCliToolHandler<MittwaldAppUpgradeArgs> = async (args) => {
  try {
    if (!args.installationId) {
      return formatToolResponse(
        "error",
        "Installation ID is required. Please provide the installationId parameter."
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['app', 'upgrade'];
    
    // Add installation ID as positional argument
    cliArgs.push(args.installationId);
    
    // Add optional flags
    if (args.targetVersion) {
      cliArgs.push('--target-version', args.targetVersion);
    }
    
    if (args.force) {
      cliArgs.push('--force');
    }
    
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    if (args.wait) {
      cliArgs.push('--wait');
    }
    
    if (args.waitTimeout) {
      cliArgs.push('--wait-timeout', args.waitTimeout);
    }
    
    // Execute CLI command with extended timeout for upgrades
    const result = await executeCli('mw', cliArgs, {
      timeout: 900000, // 15 minutes for upgrade operations
      env: {
        MITTWALD_NONINTERACTIVE: '1'
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('installation')) {
        return formatToolResponse(
          "error",
          `App installation not found. Please verify the installation ID: ${args.installationId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('version')) {
        return formatToolResponse(
          "error",
          `Target version not found. Please verify the target version: ${args.targetVersion || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('cancelled') || errorMessage.includes('abort')) {
        return formatToolResponse(
          "error",
          `Upgrade operation was cancelled. Use --force flag to skip confirmation.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to upgrade app: ${errorMessage}`
      );
    }
    
    // Success response
    const output = result.stdout || result.stderr || 'App upgraded successfully';
    
    return formatToolResponse(
      "success",
      "App upgraded successfully",
      {
        installationId: args.installationId,
        targetVersion: args.targetVersion,
        projectId: args.projectId,
        force: args.force,
        wait: args.wait,
        output: output
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
