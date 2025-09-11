import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldSshUserCreateArgs {
  projectId?: string;
  description: string;
  expires?: string;
  publicKey?: string;
  password?: string;
}

export const handleSshUserCreateCli: MittwaldToolHandler<MittwaldSshUserCreateArgs> = async (args) => {
  try {
    // Validate required fields
    if (!args.description) {
      return formatToolResponse(
        "error",
        "Description is required to create an SSH user"
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
    const cliArgs: string[] = ['ssh-user', 'create'];
    
    // Required description
    cliArgs.push('--description', args.description);
    
    // Optional project ID
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    
    // Optional expiration
    if (args.expires) {
      cliArgs.push('--expires', args.expires);
    }
    
    // Authentication method
    if (args.publicKey) {
      cliArgs.push('--public-key', args.publicKey);
    }
    
    if (args.password) {
      cliArgs.push('--password', args.password);
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
          `Permission denied when creating SSH user. Check if your API token has SSH user management permissions.\nError: ${errorMessage}`
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
        `Failed to create SSH user: ${errorMessage}`
      );
    }
    
    // Parse the output
    let sshUserId: string | null = null;
    
    // Parse the success message
    // Example: "SSH user created successfully with ID ssh-user-xxxxx"
    const idMatch = result.stdout.match(/ID\s+([a-f0-9-]+)/i);
    if (idMatch) {
      sshUserId = idMatch[1];
    }
    
    if (!sshUserId) {
      // If we can't find the ID but the command succeeded, still report success
      return formatToolResponse(
        "success",
        `Successfully created SSH user '${args.description}'`,
        {
          description: args.description,
          output: result.stdout
        }
      );
    }
    
    // Build result data
    const resultData = {
      id: sshUserId,
      description: args.description,
      authenticationMethod: args.publicKey ? 'publicKey' : 'password',
      ...(args.expires && { expires: args.expires }),
      ...(args.projectId && { projectId: args.projectId })
    };
    
    return formatToolResponse(
      "success",
      `Successfully created SSH user '${args.description}' with ID ${sshUserId}`,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};