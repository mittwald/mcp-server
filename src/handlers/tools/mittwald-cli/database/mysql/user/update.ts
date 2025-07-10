import type { MittwaldToolHandler } from '../../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../../../utils/cli-wrapper.js';

interface MittwaldDatabaseMysqlUserUpdateArgs {
  userId: string;
  quiet?: boolean;
  accessLevel?: 'readonly' | 'full';
  description?: string;
  password?: string;
  accessIpMask?: string;
  enableExternalAccess?: boolean;
  disableExternalAccess?: boolean;
}

export const handleDatabaseMysqlUserUpdate: MittwaldToolHandler<MittwaldDatabaseMysqlUserUpdateArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['database', 'mysql', 'user', 'update'];
    
    // Required arguments
    cliArgs.push(args.userId);
    
    // Optional arguments
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    if (args.accessLevel) {
      cliArgs.push('--access-level', args.accessLevel);
    }
    
    if (args.description) {
      cliArgs.push('--description', args.description);
    }
    
    if (args.password) {
      cliArgs.push('--password', args.password);
    }
    
    if (args.accessIpMask) {
      cliArgs.push('--access-ip-mask', args.accessIpMask);
    }
    
    if (args.enableExternalAccess) {
      cliArgs.push('--enable-external-access');
    }
    
    if (args.disableExternalAccess) {
      cliArgs.push('--disable-external-access');
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        // Pass through API token if available
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      // Parse error message from stderr or stdout
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Check for common error patterns
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Permission denied')) {
        return formatToolResponse(
          "error",
          `Permission denied when updating MySQL user. Check if your API token has database management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && (errorMessage.includes('user') || errorMessage.includes('User'))) {
        return formatToolResponse(
          "error",
          `MySQL user not found. Please verify the user ID: ${args.userId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('Invalid') || errorMessage.includes('invalid')) {
        return formatToolResponse(
          "error",
          `Invalid parameter provided. Please check your input values.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to update MySQL user: ${errorMessage}`
      );
    }
    
    // Success response
    const responseMessage = args.quiet ? 
      result.stdout || 'MySQL user updated successfully' :
      `Successfully updated MySQL user ${args.userId}`;
    
    // Build result data with only the fields that were provided
    const resultData: any = {
      userId: args.userId,
      updated: true,
      output: result.stdout
    };
    
    if (args.accessLevel) resultData.accessLevel = args.accessLevel;
    if (args.description) resultData.description = args.description;
    if (args.accessIpMask) resultData.accessIpMask = args.accessIpMask;
    if (args.enableExternalAccess) resultData.enableExternalAccess = args.enableExternalAccess;
    if (args.disableExternalAccess) resultData.disableExternalAccess = args.disableExternalAccess;
    
    return formatToolResponse(
      "success",
      responseMessage,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};