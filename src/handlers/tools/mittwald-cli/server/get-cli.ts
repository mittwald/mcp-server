import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldServerGetArgs {
  serverId?: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleServerGetCli: MittwaldCliToolHandler<MittwaldServerGetArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['server', 'get'];
    
    // Add server ID if provided
    if (args.serverId) {
      cliArgs.push(args.serverId);
    }
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') || errorMessage.includes('No server found')) {
        return formatToolResponse(
          "error",
          `Server not found. Please verify the server ID: ${args.serverId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get server: ${errorMessage}`
      );
    }
    
    // Parse JSON output
    try {
      const data = parseJsonOutput(result.stdout);
      
      if (!data || typeof data !== 'object') {
        return formatToolResponse(
          "error",
          "Unexpected output format from CLI command"
        );
      }
      
      // Format the data to match expected structure
      const formattedData = {
        id: data.id,
        description: data.description,
        createdAt: data.createdAt,
        isReady: data.isReady,
        status: data.status,
        // Include any additional fields from the CLI output
        ...data
      };
      
      return formatToolResponse(
        "success",
        `Server information retrieved for ${data.id || args.serverId}`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "Server retrieved (raw output)",
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