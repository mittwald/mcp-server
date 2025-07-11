import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldRegistryCreateCliArgs {
  uri: string;
  description: string;
  projectId?: string;
  quiet?: boolean;
  username?: string;
  password?: string;
}

export const handleRegistryCreateCli: MittwaldToolHandler<MittwaldRegistryCreateCliArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['registry', 'create'];
    
    // Required flags
    cliArgs.push('--uri', args.uri);
    cliArgs.push('--description', args.description);
    
    // Optional flags
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    if (args.username) {
      cliArgs.push('--username', args.username);
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
      
      if (errorMessage.includes('not found') && errorMessage.includes('project')) {
        return formatToolResponse(
          "error",
          `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        return formatToolResponse(
          "error",
          `Registry with URI '${args.uri}' already exists.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to create registry: ${errorMessage}`
      );
    }
    
    // Handle quiet output
    if (args.quiet) {
      const registryId = parseQuietOutput(result.stdout);
      return formatToolResponse(
        "success",
        `Registry created successfully`,
        {
          registryId,
          uri: args.uri,
          description: args.description,
          projectId: args.projectId,
          status: 'created'
        }
      );
    }
    
    // Handle regular output
    const successMessage = result.stdout || 'Registry created successfully';
    
    return formatToolResponse(
      "success",
      `Registry creation completed`,
      {
        uri: args.uri,
        description: args.description,
        projectId: args.projectId,
        status: 'created',
        output: successMessage
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};