import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldConversationCategoriesArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleConversationCategoriesCli: MittwaldCliToolHandler<MittwaldConversationCategoriesArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['conversation', 'categories'];
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
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
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      return formatToolResponse(
        "error",
        `Failed to list conversation categories: ${errorMessage}`
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
          "No conversation categories found",
          []
        );
      }
      
      // Format the data to match our expected structure
      const formattedData = data.map(item => ({
        id: item.id || item.categoryId,
        name: item.name,
        description: item.description,
        isActive: item.isActive,
        sortOrder: item.sortOrder
      }));
      
      return formatToolResponse(
        "success",
        `Found ${data.length} conversation category(ies)`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "Conversation categories retrieved (raw output)",
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
