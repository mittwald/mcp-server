import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldAppVersionsArgs {
  app?: string;
}

export const handleAppVersionsCli: MittwaldToolHandler<MittwaldAppVersionsArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['app', 'versions'];
    
    // Add app name as positional argument if provided
    if (args.app) {
      cliArgs.push(args.app);
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('app')) {
        return formatToolResponse(
          "error",
          `App not found. Please verify the app name: ${args.app || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get app versions: ${errorMessage}`
      );
    }
    
    // Try to parse as JSON first, fallback to plain text
    try {
      const data = parseJsonOutput(result.stdout);
      
      if (Array.isArray(data)) {
        return formatToolResponse(
          "success",
          args.app ? `Found versions for ${args.app}` : "Found available apps and versions",
          data
        );
      } else if (typeof data === 'object' && data !== null) {
        return formatToolResponse(
          "success",
          args.app ? `Found versions for ${args.app}` : "Found available apps and versions",
          data
        );
      }
    } catch (parseError) {
      // If JSON parsing fails, return as plain text
    }
    
    // Return plain text output
    const output = result.stdout || result.stderr || 'No versions found';
    
    return formatToolResponse(
      "success",
      args.app ? `Versions for ${args.app}` : "Available apps and versions",
      {
        app: args.app,
        rawOutput: output
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};