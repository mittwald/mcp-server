import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldSshUserDeleteArgs {
  sshUserId: string;
  force?: boolean;
}

export const handleSshUserDeleteCli: MittwaldToolHandler<MittwaldSshUserDeleteArgs> = async (args) => {
  try {
    // Validate required fields
    if (!args.sshUserId) {
      return formatToolResponse(
        "error",
        "SSH user ID is required to delete an SSH user"
      );
    }
    
    // Build CLI command arguments
    const cliArgs: string[] = ['ssh-user', 'delete'];
    
    // Required SSH user ID as positional argument
    cliArgs.push(args.sshUserId);
    
    // Optional flags
    if (args.force) {
      cliArgs.push('--force');
    }
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Check for common error patterns
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Permission denied')) {
        return formatToolResponse(
          "error",
          `Permission denied when deleting SSH user. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('SSH user')) {
        return formatToolResponse(
          "error",
          `SSH user not found. Please verify the SSH user ID: ${args.sshUserId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('confirmation')) {
        return formatToolResponse(
          "error",
          `Deletion requires confirmation. Use 'force: true' to confirm deletion.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to delete SSH user: ${errorMessage}`
      );
    }
    
    // Parse the output
    return formatToolResponse(
      "success",
      `SSH user ${args.sshUserId} has been successfully deleted`,
      {
        sshUserId: args.sshUserId,
        action: "deleted",
        output: result.stdout
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
