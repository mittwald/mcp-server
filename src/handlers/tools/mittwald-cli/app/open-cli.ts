import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldAppOpenArgs {
  installationId?: string;
}

export const handleAppOpenCli: MittwaldCliToolHandler<MittwaldAppOpenArgs> = async (args) => {
  try {
    if (!args.installationId) {
      return formatToolResponse(
        "error",
        "Installation ID is required. Please provide the installationId parameter."
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['app', 'open'];
    
    // Add installation ID as positional argument
    cliArgs.push(args.installationId);
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
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
      
      if (errorMessage.includes('virtual host')) {
        return formatToolResponse(
          "error",
          `No virtual host linked to app installation. A virtual host is required to open the app in browser.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to open app: ${errorMessage}`
      );
    }
    
    // Success response
    const output = result.stdout || result.stderr || 'App opened in browser';
    
    return formatToolResponse(
      "success",
      "App opened in browser successfully",
      {
        installationId: args.installationId,
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
