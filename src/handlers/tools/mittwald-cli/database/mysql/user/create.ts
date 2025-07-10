import type { MittwaldToolHandler } from '../../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../../../utils/cli-wrapper.js';

interface MittwaldDatabaseMysqlUserCreateArgs {
  databaseId: string;
  accessLevel: 'readonly' | 'full';
  description: string;
  password: string;
  quiet?: boolean;
  accessIpMask?: string;
  enableExternalAccess?: boolean;
}

export const handleDatabaseMysqlUserCreate: MittwaldToolHandler<MittwaldDatabaseMysqlUserCreateArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['database', 'mysql', 'user', 'create'];
    
    // Required arguments
    cliArgs.push('--database-id', args.databaseId);
    cliArgs.push('--access-level', args.accessLevel);
    cliArgs.push('--description', args.description);
    cliArgs.push('--password', args.password);
    
    // Optional arguments
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    if (args.accessIpMask) {
      cliArgs.push('--access-ip-mask', args.accessIpMask);
    }
    
    if (args.enableExternalAccess) {
      cliArgs.push('--enable-external-access');
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
          `Permission denied when creating MySQL user. Check if your API token has database management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('database')) {
        return formatToolResponse(
          "error",
          `Database not found. Please verify the database ID: ${args.databaseId}.\nError: ${errorMessage}`
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
        `Failed to create MySQL user: ${errorMessage}`
      );
    }
    
    // Parse the output
    let userId: string | null = null;
    
    if (args.quiet) {
      // In quiet mode, the CLI outputs just the ID
      userId = parseQuietOutput(result.stdout);
    } else {
      // In normal mode, parse the success message
      // Example: "MySQL user 'description' created successfully with ID u-xxxxx"
      const idMatch = result.stdout.match(/ID\s+([a-f0-9-]+)/i);
      if (idMatch) {
        userId = idMatch[1];
      }
    }
    
    if (!userId) {
      // If we can't find the ID but the command succeeded, still report success
      return formatToolResponse(
        "success",
        args.quiet ? result.stdout : `Successfully created MySQL user '${args.description}'`,
        {
          description: args.description,
          databaseId: args.databaseId,
          accessLevel: args.accessLevel,
          output: result.stdout
        }
      );
    }
    
    // Build result data
    const resultData = {
      id: userId,
      description: args.description,
      databaseId: args.databaseId,
      accessLevel: args.accessLevel,
      ...(args.accessIpMask && { accessIpMask: args.accessIpMask }),
      ...(args.enableExternalAccess && { enableExternalAccess: args.enableExternalAccess })
    };
    
    return formatToolResponse(
      "success",
      args.quiet ? 
        userId :
        `Successfully created MySQL user '${args.description}' with ID ${userId}`,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};