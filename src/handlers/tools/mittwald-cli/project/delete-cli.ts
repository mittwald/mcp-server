import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldProjectDeleteArgs {
  projectId: string;
  force?: boolean;
}

export const handleProjectDeleteCli: MittwaldToolHandler<MittwaldProjectDeleteArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['project', 'delete', args.projectId];
    
    // Optional flags
    if (args.force) {
      cliArgs.push('--force');
    }
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
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
          `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        return formatToolResponse(
          "error",
          `Permission denied. You may not have the required permissions to delete this project.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('dependencies') || errorMessage.includes('resources')) {
        return formatToolResponse(
          "error",
          `Project deletion failed due to existing dependencies or resources. Please remove all associated resources first.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('cancelled') || errorMessage.includes('aborted')) {
        return formatToolResponse(
          "error",
          `Project deletion was cancelled.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to delete project: ${errorMessage}`
      );
    }
    
    // Handle successful deletion
    return formatToolResponse(
      "success",
      `Project ${args.projectId} deleted successfully`,
      {
        projectId: args.projectId,
        output: result.stdout,
        force: args.force || false
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
