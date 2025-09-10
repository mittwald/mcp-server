import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldLoginResetArgs {
  // No specific parameters needed for reset
}

export const handleLoginResetCli: MittwaldCliToolHandler<MittwaldLoginResetArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['login', 'reset'];
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Handle specific error cases
      if (errorMessage.includes('not logged in') || errorMessage.includes('no active session')) {
        return formatToolResponse(
          "success",
          "No active login session to reset",
          {
            message: 'No active login session to reset',
            output: errorMessage,
            timestamp: new Date().toISOString()
          }
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to reset login: ${errorMessage}`
      );
    }
    
    // Parse success output
    const output = result.stdout.trim();
    
    const responseData = {
      message: 'Login session reset successfully',
      output: output || null,
      timestamp: new Date().toISOString()
    };
    
    return formatToolResponse(
      "success",
      "Login session reset successfully",
      responseData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
