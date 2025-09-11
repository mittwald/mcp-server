import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldSftpUserDeleteArgs {
  sftpUserId: string;
  force?: boolean;
}

export const handleSftpUserDeleteCli: MittwaldToolHandler<MittwaldSftpUserDeleteArgs> = async (args) => {
  try {
    // Validate required fields
    if (!args.sftpUserId) {
      return formatToolResponse(
        "error",
        "SFTP user ID is required to delete an SFTP user"
      );
    }
    
    // Build CLI command arguments
    const cliArgs: string[] = ['sftp-user', 'delete'];
    
    // Required SFTP user ID as positional argument
    cliArgs.push(args.sftpUserId);
    
    // Optional flags
    if (args.force) {
      cliArgs.push('--force');
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Check for common error patterns
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Permission denied')) {
        return formatToolResponse(
          "error",
          `Permission denied when deleting SFTP user. Check if your API token has SFTP user management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('SFTP user')) {
        return formatToolResponse(
          "error",
          `SFTP user not found. Please verify the SFTP user ID: ${args.sftpUserId}.\nError: ${errorMessage}`
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
        `Failed to delete SFTP user: ${errorMessage}`
      );
    }
    
    // Parse the output
    return formatToolResponse(
      "success",
      `SFTP user ${args.sftpUserId} has been successfully deleted`,
      {
        sftpUserId: args.sftpUserId,
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