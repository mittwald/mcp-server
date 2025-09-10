import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldContainerDeleteArgs {
  containerId: string;
  projectId?: string;
  force?: boolean;
  quiet?: boolean;
}

export const handleContainerDeleteCli: MittwaldToolHandler<MittwaldContainerDeleteArgs> = async (args) => {
  try {
    if (!args.containerId) {
      return formatToolResponse(
        "error",
        "Container ID is required"
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['container', 'delete', args.containerId];
    
    // Optional flags
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    if (args.force) {
      cliArgs.push('--force');
    }
    
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('container')) {
        return formatToolResponse(
          "error",
          `Container not found. Please verify the container ID: ${args.containerId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('project')) {
        return formatToolResponse(
          "error",
          `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('still running') || errorMessage.includes('must be stopped')) {
        return formatToolResponse(
          "error",
          `Container must be stopped before deletion. Please stop the container first.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to delete container: ${errorMessage}`
      );
    }
    
    // Handle quiet mode output
    if (args.quiet) {
      const containerId = parseQuietOutput(result.stdout);
      return formatToolResponse(
        "success",
        `Container ${args.containerId} has been deleted successfully`,
        {
          containerId: containerId || args.containerId,
          action: "delete",
          projectId: args.projectId
        }
      );
    }
    
    // Handle normal output
    return formatToolResponse(
      "success",
      `Container ${args.containerId} has been deleted successfully`,
      {
        containerId: args.containerId,
        action: "delete",
        projectId: args.projectId,
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
