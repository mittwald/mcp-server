import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldAppUpdateArgs {
  installationId?: string;
  quiet?: boolean;
  description?: string;
  entrypoint?: string;
  documentRoot?: string;
}

export const handleAppUpdateCli: MittwaldCliToolHandler<MittwaldAppUpdateArgs> = async (args) => {
  try {
    if (!args.installationId) {
      return formatToolResponse(
        "error",
        "Installation ID is required. Please provide the installationId parameter."
      );
    }

    // Check if at least one update parameter is provided
    if (!args.description && !args.entrypoint && !args.documentRoot) {
      return formatToolResponse(
        "error",
        "At least one update parameter is required (description, entrypoint, or documentRoot)."
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['app', 'update'];
    
    // Add installation ID as positional argument
    cliArgs.push(args.installationId);
    
    // Add optional flags
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    if (args.description) {
      cliArgs.push('--description', args.description);
    }
    
    if (args.entrypoint) {
      cliArgs.push('--entrypoint', args.entrypoint);
    }
    
    if (args.documentRoot) {
      cliArgs.push('--document-root', args.documentRoot);
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || '',
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
      
      if (errorMessage.includes('not supported')) {
        return formatToolResponse(
          "error",
          `Update operation not supported for this app type. Check the app documentation for supported update fields.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to update app: ${errorMessage}`
      );
    }
    
    // Success response
    const output = result.stdout || result.stderr || 'App updated successfully';
    
    // Build update summary
    const updates: string[] = [];
    if (args.description) updates.push(`description: ${args.description}`);
    if (args.entrypoint) updates.push(`entrypoint: ${args.entrypoint}`);
    if (args.documentRoot) updates.push(`document root: ${args.documentRoot}`);
    
    return formatToolResponse(
      "success",
      "App updated successfully",
      {
        installationId: args.installationId,
        updates: updates,
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