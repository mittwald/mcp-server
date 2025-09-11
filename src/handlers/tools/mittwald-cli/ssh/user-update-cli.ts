import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldSshUserUpdateArgs {
  sshUserId: string;
  expires?: string;
  description?: string;
  publicKey?: string;
  password?: string;
  enable?: boolean;
  disable?: boolean;
}

export const handleSshUserUpdateCli: MittwaldToolHandler<MittwaldSshUserUpdateArgs> = async (args) => {
  try {
    // Validate required fields
    if (!args.sshUserId) {
      return formatToolResponse(
        "error",
        "SSH user ID is required to update an SSH user"
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
    const cliArgs: string[] = ['ssh-user', 'update'];
    
    // Required SSH user ID as positional argument
    cliArgs.push(args.sshUserId);
    
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
          `Permission denied when updating SSH user. Check if your API token has SSH user management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('SSH user')) {
        return formatToolResponse(
          "error",
          `SSH user not found. Please verify the SSH user ID: ${args.sshUserId}.\nError: ${errorMessage}`
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
        `Failed to update SSH user: ${errorMessage}`
      );
    }
    
    // Parse the output
    // Build list of updated fields for better feedback
    const updatedFields = [];
    if (args.description) updatedFields.push('description');
    if (args.expires) updatedFields.push('expires');
    if (args.publicKey) updatedFields.push('public key');
    if (args.password) updatedFields.push('password');
    if (args.enable) updatedFields.push('enabled');
    if (args.disable) updatedFields.push('disabled');
    
    return formatToolResponse(
      "success",
      `SSH user ${args.sshUserId} updated successfully`,
      {
        sshUserId: args.sshUserId,
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