import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldProjectListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  csvSeparator?: ',' | ';';
  noHeader?: boolean;
  noRelativeDates?: boolean;
  noTruncate?: boolean;
}

export const handleMittwaldProjectListCli: MittwaldToolHandler<MittwaldProjectListArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['project', 'list'];
    
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
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
        return formatToolResponse(
          "error",
          `Authentication failed. Please verify your API token is set correctly.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to list projects: ${errorMessage}`
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
          "No projects found",
          []
        );
      }
      
      // Format the data to match our expected structure
      const formattedData = data.map(item => ({
        id: item.id,
        shortId: item.shortId,
        description: item.description,
        createdAt: item.createdAt,
        serverId: item.serverId,
        enabled: item.enabled,
        readiness: item.readiness
      }));
      
      return formatToolResponse(
        "success",
        `Found ${data.length} project(s)`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "Projects retrieved (raw output)",
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