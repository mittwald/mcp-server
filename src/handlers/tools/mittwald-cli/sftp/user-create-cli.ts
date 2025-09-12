import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldSftpUserCreateArgs {
  projectId?: string;
  description: string;
  directories: string[];
  expires?: string;
  publicKey?: string;
  password?: string;
  accessLevel?: 'read' | 'full';
}

export const handleSftpUserCreateCli: MittwaldToolHandler<MittwaldSftpUserCreateArgs> = async (args) => {
  try {
    // Validate required fields
    if (!args.description) {
      return formatToolResponse(
        "error",
        "Description is required to create an SFTP user"
      );
    }
    
    if (!args.directories || args.directories.length === 0) {
      return formatToolResponse(
        "error",
        "At least one directory must be specified"
      );
    }
    
    // Validate authentication method - either password or public key, but not both
    if (args.password && args.publicKey) {
      return formatToolResponse(
        "error",
        "Cannot specify both password and public key authentication. Choose one."
      );
    }
    
    if (!args.password && !args.publicKey) {
      return formatToolResponse(
        "error",
        "Either password or public key must be specified for authentication"
      );
    }
    
    // Build CLI command arguments
    const cliArgs: string[] = ['sftp-user', 'create'];
    
    // Required fields
    cliArgs.push('--description', args.description);
    
    // Add directories (can be multiple)
    for (const directory of args.directories) {
      cliArgs.push('--directories', directory);
    }
    
    // Optional project ID
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    
    // Optional expiration
    if (args.expires) {
      cliArgs.push('--expires', args.expires);
    }
    
    // Access level
    if (args.accessLevel) {
      cliArgs.push('--access-level', args.accessLevel);
    }
    
    // Authentication method
    if (args.publicKey) {
      cliArgs.push('--public-key', args.publicKey);
    }
    
    if (args.password) {
      cliArgs.push('--password', args.password);
    }
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Check for common error patterns
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Permission denied')) {
        return formatToolResponse(
          "error",
          `Permission denied when creating SFTP user. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('project')) {
        return formatToolResponse(
          "error",
          `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorMessage}`
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
        `Failed to create SFTP user: ${errorMessage}`
      );
    }
    
    // Parse the output
    let sftpUserId: string | null = null;
    
    // Parse the success message
    // Example: "SFTP user created successfully with ID sftp-user-xxxxx"
    const idMatch = result.stdout.match(/ID\s+([a-f0-9-]+)/i);
    if (idMatch) {
      sftpUserId = idMatch[1];
    }
    
    if (!sftpUserId) {
      // If we can't find the ID but the command succeeded, still report success
      return formatToolResponse(
        "success",
        `Successfully created SFTP user '${args.description}'`,
        {
          description: args.description,
          directories: args.directories,
          output: result.stdout
        }
      );
    }
    
    // Build result data
    const resultData = {
      id: sftpUserId,
      description: args.description,
      directories: args.directories,
      accessLevel: args.accessLevel || 'read',
      authenticationMethod: args.publicKey ? 'publicKey' : 'password',
      ...(args.expires && { expires: args.expires }),
      ...(args.projectId && { projectId: args.projectId })
    };
    
    return formatToolResponse(
      "success",
      `Successfully created SFTP user '${args.description}' with ID ${sftpUserId}`,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
