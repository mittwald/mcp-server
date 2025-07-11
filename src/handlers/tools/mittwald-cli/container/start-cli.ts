import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldContainerStartArgs {
  containerId: string;
  projectId?: string;
  quiet?: boolean;
}

export const handleContainerStartCli: MittwaldToolHandler<MittwaldContainerStartArgs> = async (args) => {
  try {
    if (!args.containerId) {
      return formatToolResponse(
        "error",
        "Container ID is required"
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['container', 'start', args.containerId];
    
    // Optional flags
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    if (args.quiet) {
      cliArgs.push('--quiet');
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
      
      if (errorMessage.includes('already running') || errorMessage.includes('already started')) {
        return formatToolResponse(
          "success",
          `Container ${args.containerId} is already running`,
          {
            containerId: args.containerId,
            action: "start",
            projectId: args.projectId,
            status: "already_running"
          }
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to start container: ${errorMessage}`
      );
    }
    
    // Handle quiet mode output
    if (args.quiet) {
      const containerId = parseQuietOutput(result.stdout);
      return formatToolResponse(
        "success",
        `Container ${args.containerId} has been started successfully`,
        {
          containerId: containerId || args.containerId,
          action: "start",
          projectId: args.projectId
        }
      );
    }
    
    // Handle normal output
    return formatToolResponse(
      "success",
      `Container ${args.containerId} has been started successfully`,
      {
        containerId: args.containerId,
        action: "start",
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