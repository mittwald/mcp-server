import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldUserSshKeyGetArgs {
  keyId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleUserSshKeyGetCli: MittwaldToolHandler<MittwaldUserSshKeyGetArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['user', 'ssh-key', 'get'];
    
    // Add key ID
    cliArgs.push(args.keyId);
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') || errorMessage.includes('No SSH key found')) {
        return formatToolResponse(
          "error",
          `SSH key not found: ${args.keyId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get SSH key: ${errorMessage}`
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
        comment: data.comment,
        fingerprint: data.fingerprint,
        publicKey: data.publicKey,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        // Include any additional fields from the CLI output
        ...data
      };
      
      return formatToolResponse(
        "success",
        `SSH key information retrieved for ${args.keyId}`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "SSH key retrieved (raw output)",
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
