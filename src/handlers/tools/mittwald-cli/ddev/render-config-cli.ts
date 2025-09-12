import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldDdevRenderConfigArgs {
  appInstallationId: string;
  force?: boolean;
}

export const handleDdevRenderConfigCli: MittwaldCliToolHandler<MittwaldDdevRenderConfigArgs> = async (args) => {
  try {
    // Validate required parameters
    if (!args.appInstallationId) {
      return formatToolResponse(
        "error",
        "app-installation-id is required"
      );
    }
    
    // Build CLI command arguments
    const cliArgs: string[] = ['ddev', 'render-config', args.appInstallationId];
    
    // Add optional parameters
    if (args.force) {
      cliArgs.push('--force');
    }
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Handle specific error cases
      if (errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `App installation not found: ${args.appInstallationId}. ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('already exists') && !args.force) {
        return formatToolResponse(
          "error",
          `Configuration already exists. Use --force to overwrite: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `DDEV render-config failed: ${errorMessage}`
      );
    }
    
    // Parse success output
    const output = result.stdout.trim();
    
    // Parse config path from output if available
    let configPath = null;
    const configPathMatch = output.match(/Generated configuration file: (.+)/);
    if (configPathMatch) {
      configPath = configPathMatch[1];
    }
    
    const responseData = {
      success: true,
      message: "DDEV configuration rendered successfully",
      configPath: configPath,
      output: output || null,
      timestamp: new Date().toISOString()
    };
    
    return formatToolResponse(
      "success",
      "DDEV configuration rendered successfully",
      responseData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
