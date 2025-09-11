import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldCronjobExecuteCliArgs {
  cronjobId: string;
}

export const handleCronjobExecuteCli: MittwaldToolHandler<MittwaldCronjobExecuteCliArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['cronjob', 'execute', args.cronjobId];
    
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Cronjob not found: ${args.cronjobId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to execute cronjob: ${errorMessage}`
      );
    }
    
    // Return success
    return formatToolResponse(
      "success",
      `Cronjob execution started`,
      {
        cronjobId: args.cronjobId,
        output: result.stdout
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};