import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldContainerStopArgs {
  containerId: string;
  projectId?: string;
}

export const handleContainerStopCli: MittwaldToolHandler<MittwaldContainerStopArgs> = async (args) => {
  try {
    if (!args.containerId) {
      return formatToolResponse(
        "error",
        "Container ID is required"
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['container', 'stop', args.containerId];
    
    // Optional flags
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
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
      
      if (errorMessage.includes('already stopped') || errorMessage.includes('not running')) {
        return formatToolResponse(
          "success",
          `Container ${args.containerId} is already stopped`,
          {
            containerId: args.containerId,
            action: "stop",
            projectId: args.projectId,
            status: "already_stopped"
          }
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to stop container: ${errorMessage}`
      );
    }
    
    // Handle normal output
    return formatToolResponse(
      "success",
      `Container ${args.containerId} has been stopped successfully`,
      {
        containerId: args.containerId,
        action: "stop",
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