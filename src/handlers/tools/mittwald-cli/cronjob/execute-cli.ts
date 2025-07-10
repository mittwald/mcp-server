import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldCronjobExecuteCliArgs {
  cronjobId: string;
  quiet?: boolean;
}

export const handleCronjobExecuteCli: MittwaldToolHandler<MittwaldCronjobExecuteCliArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['cronjob', 'execute', args.cronjobId];
    
    // Optional flags
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
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
    
    // Handle quiet output
    if (args.quiet) {
      const executionId = parseQuietOutput(result.stdout);
      if (executionId) {
        return formatToolResponse(
          "success",
          `Cronjob execution started`,
          { 
            cronjobId: args.cronjobId,
            executionId: executionId 
          }
        );
      }
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