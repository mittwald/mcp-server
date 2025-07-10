import type { MittwaldToolHandler } from '../../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../../../utils/cli-wrapper.js';

interface MittwaldDatabaseMysqlUserListArgs {
  databaseId: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleDatabaseMysqlUserList: MittwaldToolHandler<MittwaldDatabaseMysqlUserListArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['database', 'mysql', 'user', 'list'];
    
    // Required arguments
    cliArgs.push('--database-id', args.databaseId);
    cliArgs.push('--output', args.output || 'json');
    
    // Optional arguments
    if (args.extended) {
      cliArgs.push('--extended');
    }
    
    if (args.noHeader) {
      cliArgs.push('--no-header');
    }
    
    if (args.noTruncate) {
      cliArgs.push('--no-truncate');
    }
    
    if (args.noRelativeDates) {
      cliArgs.push('--no-relative-dates');
    }
    
    if (args.csvSeparator) {
      cliArgs.push('--csv-separator', args.csvSeparator);
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
          `Permission denied when listing MySQL users. Check if your API token has database management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('database')) {
        return formatToolResponse(
          "error",
          `Database not found. Please verify the database ID: ${args.databaseId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to list MySQL users: ${errorMessage}`
      );
    }
    
    // Parse the output based on format
    let users: any = null;
    let responseMessage: string;
    
    if (args.output === 'json' || !args.output) {
      try {
        users = parseJsonOutput(result.stdout);
        responseMessage = `Found ${Array.isArray(users) ? users.length : 'unknown number of'} MySQL users for database ${args.databaseId}`;
      } catch (error) {
        return formatToolResponse(
          "error",
          `Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}\nRaw output: ${result.stdout}`
        );
      }
    } else {
      // For non-JSON formats, return the raw output
      users = result.stdout;
      responseMessage = `MySQL users for database ${args.databaseId}:`;
    }
    
    return formatToolResponse(
      "success",
      responseMessage,
      {
        databaseId: args.databaseId,
        users: users,
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