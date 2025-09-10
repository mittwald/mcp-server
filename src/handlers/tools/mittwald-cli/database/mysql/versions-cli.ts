import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldDatabaseMysqlVersionsArgs {
  output?: "txt" | "json" | "yaml" | "csv" | "tsv";
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: "," | ";";
}

export const handleDatabaseMysqlVersionsCli: MittwaldToolHandler<MittwaldDatabaseMysqlVersionsArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['database', 'mysql', 'versions'];
    
    // Output format (default to json for structured data)
    const outputFormat = args.output || 'json';
    cliArgs.push('--output', outputFormat);
    
    // Extended information
    if (args.extended) {
      cliArgs.push('--extended');
    }
    
    // Formatting options
    if (args.noHeader) {
      cliArgs.push('--no-header');
    }
    
    if (args.noTruncate) {
      cliArgs.push('--no-truncate');
    }
    
    if (args.noRelativeDates) {
      cliArgs.push('--no-relative-dates');
    }
    
    if (args.csvSeparator && (outputFormat === 'csv' || outputFormat === 'tsv')) {
      cliArgs.push('--csv-separator', args.csvSeparator);
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
          `Permission denied when listing MySQL versions. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to list MySQL versions: ${errorMessage}`
      );
    }
    
    // Parse the output based on format
    if (outputFormat === 'json') {
      try {
        const versions = parseJsonOutput(result.stdout);
        return formatToolResponse(
          "success",
          `Successfully retrieved ${Array.isArray(versions) ? versions.length : 'MySQL'} versions`,
          versions
        );
      } catch (error) {
        return formatToolResponse(
          "error",
          `Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } else {
      // For other formats (txt, yaml, csv, tsv), return the raw output
      return formatToolResponse(
        "success",
        "MySQL versions retrieved successfully",
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
