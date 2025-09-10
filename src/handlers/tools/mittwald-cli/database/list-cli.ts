import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldDatabaseListArgs {
  projectId?: string;
  output?: "txt" | "json" | "yaml" | "csv" | "tsv";
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleDatabaseListCli: MittwaldToolHandler<MittwaldDatabaseListArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['database', 'list'];
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Optional project ID filter
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    // Optional flags
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
    const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      // Parse error message from stderr or stdout
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Check for common error patterns
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Permission denied')) {
        return formatToolResponse(
          "error",
          `Permission denied when accessing databases. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        if (args.projectId) {
          return formatToolResponse(
            "error",
            `Project not found. Please verify the project ID: ${args.projectId}\nError: ${errorMessage}`
          );
        } else {
          return formatToolResponse(
            "error",
            `Resource not found.\nError: ${errorMessage}`
          );
        }
      }
      
      return formatToolResponse(
        "error",
        `Failed to list databases: ${errorMessage}`
      );
    }
    
    // Parse JSON output
    try {
      const data = parseJsonOutput(result.stdout);
      
      if (!Array.isArray(data)) {
        return formatToolResponse(
          "error",
          "Unexpected output format from CLI command"
        );
      }
      
      if (data.length === 0) {
        return formatToolResponse(
          "success",
          "No databases found",
          []
        );
      }
      
      // Format the data to match our expected structure
      const formattedData = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        projectId: item.projectId,
        type: item.type,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
      
      return formatToolResponse(
        "success",
        `Found ${data.length} database(s)`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "Databases retrieved (raw output)",
        {
          rawOutput: result.stdout,
          parseError: parseError instanceof Error ? parseError.message : String(parseError)
        }
      );
    }
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
