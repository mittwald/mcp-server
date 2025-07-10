import type { MittwaldToolHandler } from '../../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../../../utils/cli-wrapper.js';

interface MittwaldDatabaseMysqlUserDeleteArgs {
  userId: string;
  quiet?: boolean;
  force?: boolean;
}

export const handleDatabaseMysqlUserDelete: MittwaldToolHandler<MittwaldDatabaseMysqlUserDeleteArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['database', 'mysql', 'user', 'delete'];
    
    // Required arguments
    cliArgs.push(args.userId);
    
    // Optional arguments
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    if (args.force) {
      cliArgs.push('--force');
    }
    
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
          `Permission denied when deleting MySQL user. Check if your API token has database management permissions.\nError: ${errorMessage}`
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
        `Failed to delete MySQL user: ${errorMessage}`
      );
    }
    
    // Success response
    const responseMessage = args.quiet ? 
      result.stdout || 'MySQL user deleted successfully' :
      `Successfully deleted MySQL user ${args.userId}`;
    
    return formatToolResponse(
      "success",
      responseMessage,
      {
        userId: args.userId,
        deleted: true,
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