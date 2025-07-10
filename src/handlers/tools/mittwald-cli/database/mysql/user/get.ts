import type { MittwaldToolHandler } from '../../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../../../utils/cli-wrapper.js';

interface MittwaldDatabaseMysqlUserGetArgs {
  userId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleDatabaseMysqlUserGet: MittwaldToolHandler<MittwaldDatabaseMysqlUserGetArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['database', 'mysql', 'user', 'get'];
    
    // Required arguments
    cliArgs.push(args.userId);
    cliArgs.push('--output', args.output || 'json');
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        // Pass through API token if available
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      // Parse error message from stderr or stdout
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Check for common error patterns
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Permission denied')) {
        return formatToolResponse(
          "error",
          `Permission denied when getting MySQL user. Check if your API token has database management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && (errorMessage.includes('user') || errorMessage.includes('User'))) {
        return formatToolResponse(
          "error",
          `MySQL user not found. Please verify the user ID: ${args.userId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get MySQL user: ${errorMessage}`
      );
    }
    
    // Parse the output based on format
    let user: any = null;
    let responseMessage: string;
    
    if (args.output === 'json' || !args.output) {
      try {
        user = parseJsonOutput(result.stdout);
        responseMessage = `Retrieved MySQL user ${args.userId}`;
      } catch (error) {
        return formatToolResponse(
          "error",
          `Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}\nRaw output: ${result.stdout}`
        );
      }
    } else {
      // For non-JSON formats, return the raw output
      user = result.stdout;
      responseMessage = `MySQL user ${args.userId} details:`;
    }
    
    return formatToolResponse(
      "success",
      responseMessage,
      {
        userId: args.userId,
        user: user,
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