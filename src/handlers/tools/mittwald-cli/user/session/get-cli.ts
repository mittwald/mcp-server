import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldUserSessionGetArgs {
  tokenId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleUserSessionGetCli: MittwaldCliToolHandler<MittwaldUserSessionGetArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['user', 'session', 'get'];
    
    // Add token ID
    cliArgs.push(args.tokenId);
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') || errorMessage.includes('No session found')) {
        return formatToolResponse(
          "error",
          `Session not found: ${args.tokenId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get session: ${errorMessage}`
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
        tokenId: data.tokenId,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        // Include any additional fields from the CLI output
        ...data
      };
      
      return formatToolResponse(
        "success",
        `Session information retrieved for ${args.tokenId}`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "Session retrieved (raw output)",
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
