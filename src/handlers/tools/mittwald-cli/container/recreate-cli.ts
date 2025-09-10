import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldContainerRecreateArgs {
  containerId: string;
  projectId?: string;
  quiet?: boolean;
  pull?: boolean;
  force?: boolean;
}

export const handleContainerRecreateCli: MittwaldToolHandler<MittwaldContainerRecreateArgs> = async (args) => {
  try {
    if (!args.containerId) {
      return formatToolResponse(
        "error",
        "Container ID is required"
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['container', 'recreate', args.containerId];
    
    // Optional flags
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    if (args.pull) {
      cliArgs.push('--pull');
    }
    
    if (args.force) {
      cliArgs.push('--force');
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
      
      if (errorMessage.includes('up to date') && !args.force) {
        return formatToolResponse(
          "error",
          `Container is already up to date. Use --force flag to recreate anyway.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to recreate container: ${errorMessage}`
      );
    }
    
    // Handle quiet mode output
    if (args.quiet) {
      const containerId = parseQuietOutput(result.stdout);
      return formatToolResponse(
        "success",
        `Container ${args.containerId} has been recreated successfully`,
        {
          containerId: containerId || args.containerId,
          action: "recreate",
          projectId: args.projectId,
          pull: args.pull,
          force: args.force
        }
      );
    }
    
    // Handle normal output
    return formatToolResponse(
      "success",
      `Container ${args.containerId} has been recreated successfully`,
      {
        containerId: args.containerId,
        action: "recreate",
        projectId: args.projectId,
        pull: args.pull,
        force: args.force,
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
