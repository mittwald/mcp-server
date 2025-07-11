import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldDatabaseMysqlGetArgs {
  databaseId: string;
  output?: "txt" | "json" | "yaml";
}

export const handleDatabaseMysqlGetCli: MittwaldToolHandler<MittwaldDatabaseMysqlGetArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['database', 'mysql', 'get'];
    
    // Required database ID
    cliArgs.push(args.databaseId);
    
    // Output format (default to json for structured data)
    const outputFormat = args.output || 'json';
    cliArgs.push('--output', outputFormat);
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
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
          `Permission denied when accessing MySQL database. Check if your API token has database read permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return formatToolResponse(
          "error",
          `MySQL database not found. Please verify the database ID: ${args.databaseId}\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get MySQL database: ${errorMessage}`
      );
    }
    
    // Parse the output based on format
    if (outputFormat === 'json') {
      try {
        const database = parseJsonOutput(result.stdout);
        return formatToolResponse(
          "success",
          `Successfully retrieved MySQL database information for ${args.databaseId}`,
          database
        );
      } catch (error) {
        return formatToolResponse(
          "error",
          `Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } else {
      // For other formats (txt, yaml), return the raw output
      return formatToolResponse(
        "success",
        "MySQL database information retrieved successfully",
        result.stdout
      );
    }
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};