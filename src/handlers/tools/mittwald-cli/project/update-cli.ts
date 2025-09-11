import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldProjectUpdateArgs {
  projectId: string;
  description?: string;
}

export const handleProjectUpdateCli: MittwaldToolHandler<MittwaldProjectUpdateArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['project', 'update', args.projectId];
    
    // Optional flags
    if (args.description) {
      cliArgs.push('--description', args.description);
    }
    
    // Check if we have any update flags
    if (!args.description) {
      return formatToolResponse(
        "error",
        "No update parameters provided. Please specify at least one field to update (e.g., description)."
      );
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
          `Project not found. Please verify the project ID: ${args.projectId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
        return formatToolResponse(
          "error",
          `Authentication failed. Please verify your API token is set correctly.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        return formatToolResponse(
          "error",
          `Permission denied. You may not have the required permissions to update this project.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to update project: ${errorMessage}`
      );
    }
    
    // Handle successful update
    return formatToolResponse(
      "success",
      `Project ${args.projectId} updated successfully`,
      {
        projectId: args.projectId,
        description: args.description,
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