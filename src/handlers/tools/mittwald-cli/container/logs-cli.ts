import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldContainerLogsArgs {
  containerId: string;
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml';
  noPager?: boolean;
}

export const handleContainerLogsCli: MittwaldToolHandler<MittwaldContainerLogsArgs> = async (args) => {
  try {
    if (!args.containerId) {
      return formatToolResponse(
        "error",
        "Container ID is required"
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['container', 'logs', args.containerId];
    
    // Always use txt output for logs (JSON not useful for log content)
    cliArgs.push('--output', args.output || 'txt');
    
    // Always disable pager in CLI context
    cliArgs.push('--no-pager');
    
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
      
      return formatToolResponse(
        "error",
        `Failed to get container logs: ${errorMessage}`
      );
    }
    
    // For logs, we usually want the raw output
    if (!result.stdout || result.stdout.trim() === '') {
      return formatToolResponse(
        "success",
        "No logs found for the specified container",
        {
          containerId: args.containerId,
          projectId: args.projectId,
          logs: ""
        }
      );
    }
    
    // Handle JSON output if requested
    if (args.output === 'json') {
      try {
        const data = parseJsonOutput(result.stdout);
        return formatToolResponse(
          "success",
          `Retrieved logs for container ${args.containerId}`,
          data
        );
      } catch (parseError) {
        // If JSON parsing fails, treat as text
        return formatToolResponse(
          "success",
          `Retrieved logs for container ${args.containerId}`,
          {
            containerId: args.containerId,
            projectId: args.projectId,
            logs: result.stdout,
            format: 'text'
          }
        );
      }
    }
    
    // Return raw text logs
    return formatToolResponse(
      "success",
      result.stdout,
      {
        containerId: args.containerId,
        projectId: args.projectId,
        format: args.output || 'txt'
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};