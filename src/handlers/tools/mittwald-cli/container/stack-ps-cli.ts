import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldStackPsCliArgs {
  stackId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleStackPsCli: MittwaldToolHandler<MittwaldStackPsCliArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['stack', 'ps'];
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Optional flags
    if (args.stackId) {
      cliArgs.push('--stack-id', args.stackId);
    }
    
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
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('stack')) {
        return formatToolResponse(
          "error",
          `Stack not found: ${args.stackId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to list stack services: ${errorMessage}`
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
          "No services found in the stack",
          []
        );
      }
      
      // Format the data to match our expected structure
      const formattedData = data.map(item => ({
        id: item.id,
        name: item.name,
        state: item.state,
        image: item.image,
        ports: item.ports || [],
        stackId: item.stackId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
      
      return formatToolResponse(
        "success",
        `Found ${data.length} service${data.length === 1 ? '' : 's'} in the stack`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "Stack services retrieved (raw output)",
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