import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../../utils/cli-wrapper.js';

interface MittwaldUserSshKeyDeleteArgs {
  keyId: string;
  force?: boolean;
}

export const handleUserSshKeyDeleteCli: MittwaldToolHandler<MittwaldUserSshKeyDeleteArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['user', 'ssh-key', 'delete'];
    
    // Add key ID
    cliArgs.push(args.keyId);
    
    // Optional flags
    if (args.force) {
      cliArgs.push('--force');
    }
    
    
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
        `Failed to delete SSH key: ${errorMessage}`
      );
    }
    
    // Return success with the output
    const output = result.stdout.trim();
    
    return formatToolResponse(
      "success",
      output || `SSH key ${args.keyId} deleted successfully`,
      {
        keyId: args.keyId,
        deleted: true,
        rawOutput: output
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
