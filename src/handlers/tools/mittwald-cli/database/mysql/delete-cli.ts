import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../../utils/cli-wrapper.js';

interface MittwaldDatabaseMysqlDeleteArgs {
  databaseId: string;
  force?: boolean;
}

export const handleDatabaseMysqlDeleteCli: MittwaldToolHandler<MittwaldDatabaseMysqlDeleteArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['database', 'mysql', 'delete'];
    
    // Required database ID
    cliArgs.push(args.databaseId);
    
    
    // Force mode (do not ask for confirmation)
    if (args.force) {
      cliArgs.push('--force');
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      // Parse error message from stderr or stdout
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Check for common error patterns
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Permission denied')) {
        return formatToolResponse(
          "error",
          `Permission denied when deleting MySQL database. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return formatToolResponse(
          "error",
          `MySQL database not found. Please verify the database ID: ${args.databaseId}\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('cancelled') || errorMessage.includes('aborted')) {
        return formatToolResponse(
          "error",
          `Database deletion was cancelled. Use --force flag to skip confirmation.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('in use') || errorMessage.includes('active connections')) {
        return formatToolResponse(
          "error",
          `Cannot delete database - it may have active connections or be in use.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to delete MySQL database: ${errorMessage}`
      );
    }
    
    // Build result data
    const resultData = {
      databaseId: args.databaseId,
      deleted: true,
      output: result.stdout
    };
    
    return formatToolResponse(
      "success",
      `Successfully deleted MySQL database '${args.databaseId}'`,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
