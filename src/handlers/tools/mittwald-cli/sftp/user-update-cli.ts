import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldSftpUserUpdateArgs {
  sftpUserId: string;
  expires?: string;
  description?: string;
  publicKey?: string;
  password?: string;
  accessLevel?: 'read' | 'full';
  directories?: string[];
  enable?: boolean;
  disable?: boolean;
}

export const handleSftpUserUpdateCli: MittwaldToolHandler<MittwaldSftpUserUpdateArgs> = async (args) => {
  try {
    // Validate required fields
    if (!args.sftpUserId) {
      return formatToolResponse(
        "error",
        "SFTP user ID is required to update an SFTP user"
      );
    }
    
    // Validate mutually exclusive options
    if (args.enable && args.disable) {
      return formatToolResponse(
        "error",
        "Cannot specify both --enable and --disable flags"
      );
    }

    if (args.publicKey && args.password) {
      return formatToolResponse(
        "error",
        "Cannot specify both --public-key and --password (they are mutually exclusive)"
      );
    }
    
    // Build CLI command arguments
    const cliArgs: string[] = ['sftp-user', 'update'];
    
    // Required SFTP user ID as positional argument
    cliArgs.push(args.sftpUserId);
    
    // Optional flags
    if (args.expires) {
      cliArgs.push('--expires', args.expires);
    }
    
    if (args.description) {
      cliArgs.push('--description', args.description);
    }
    
    if (args.publicKey) {
      cliArgs.push('--public-key', args.publicKey);
    }
    
    if (args.password) {
      cliArgs.push('--password', args.password);
    }
    
    if (args.accessLevel) {
      cliArgs.push('--access-level', args.accessLevel);
    }
    
    // Add directories (can be multiple)
    if (args.directories) {
      for (const directory of args.directories) {
        cliArgs.push('--directories', directory);
      }
    }
    
    if (args.enable) {
      cliArgs.push('--enable');
    }
    
    if (args.disable) {
      cliArgs.push('--disable');
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
          `Permission denied when updating SFTP user. Check if your API token has SFTP user management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('SFTP user')) {
        return formatToolResponse(
          "error",
          `SFTP user not found. Please verify the SFTP user ID: ${args.sftpUserId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('Invalid') && errorMessage.includes('format')) {
        return formatToolResponse(
          "error",
          `Invalid format in request. Please check your parameters.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to update SFTP user: ${errorMessage}`
      );
    }
    
    // Parse the output
    // Build list of updated fields for better feedback
    const updatedFields = [];
    if (args.description) updatedFields.push('description');
    if (args.expires) updatedFields.push('expires');
    if (args.publicKey) updatedFields.push('public key');
    if (args.password) updatedFields.push('password');
    if (args.accessLevel) updatedFields.push('access level');
    if (args.directories) updatedFields.push('directories');
    if (args.enable) updatedFields.push('enabled');
    if (args.disable) updatedFields.push('disabled');
    
    return formatToolResponse(
      "success",
      `SFTP user ${args.sftpUserId} updated successfully`,
      {
        sftpUserId: args.sftpUserId,
        action: "updated",
        updatedFields: updatedFields,
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