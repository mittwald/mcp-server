import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldCronjobExecutionAbortCliArgs {
  cronjobId: string;
  executionId: string;
}

export const handleCronjobExecutionAbortCli: MittwaldToolHandler<MittwaldCronjobExecutionAbortCliArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['cronjob', 'execution', 'abort', args.cronjobId, args.executionId];
    
    // Optional flags
    
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
          `Cronjob or execution not found: ${args.cronjobId} / ${args.executionId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('already finished') || errorMessage.includes('not running')) {
        return formatToolResponse(
          "error",
          `Cronjob execution is not running or already finished: ${args.executionId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to abort cronjob execution: ${errorMessage}`
      );
    }
    
    // Return success
    return formatToolResponse(
      "success",
      `Cronjob execution aborted successfully`,
      {
        cronjobId: args.cronjobId,
        executionId: args.executionId,
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