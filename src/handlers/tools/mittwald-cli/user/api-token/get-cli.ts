import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldUserApiTokenGetArgs {
  tokenId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleUserApiTokenGetCli: MittwaldToolHandler<MittwaldUserApiTokenGetArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['user', 'api-token', 'get'];
    
    // Add token ID
    cliArgs.push(args.tokenId);
    
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
      
      if (errorMessage.includes('not found') || errorMessage.includes('No token found')) {
        return formatToolResponse(
          "error",
          `API token not found: ${args.tokenId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get API token: ${errorMessage}`
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
        roles: data.roles,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        // Include any additional fields from the CLI output
        ...data
      };
      
      return formatToolResponse(
        "success",
        `API token information retrieved for ${args.tokenId}`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "API token retrieved (raw output)",
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