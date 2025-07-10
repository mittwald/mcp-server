import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldContextResetArgs {
  // No specific parameters needed for reset
}

export const handleContextResetCli: MittwaldCliToolHandler<MittwaldContextResetArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['context', 'reset'];
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Handle specific error cases
      if (errorMessage.includes('no context to reset')) {
        return formatToolResponse(
          "success",
          "No context parameters were set to reset",
          {
            message: 'No context parameters were set to reset',
            output: errorMessage,
            timestamp: new Date().toISOString()
          }
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to reset context: ${errorMessage}`
      );
    }
    
    // Parse success output
    const output = result.stdout.trim();
    
    const responseData = {
      message: 'Context parameters reset successfully',
      output: output || null,
      timestamp: new Date().toISOString()
    };
    
    return formatToolResponse(
      "success",
      "Context parameters reset successfully",
      responseData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};