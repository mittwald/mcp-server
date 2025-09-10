import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldProjectFilesystemUsageArgs {
  projectId: string;
  output?: 'txt' | 'json' | 'yaml';
  human?: boolean;
}

export const handleProjectFilesystemUsageCli: MittwaldToolHandler<MittwaldProjectFilesystemUsageArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['project', 'filesystem', 'usage', args.projectId];
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Optional flags
    if (args.human) {
      cliArgs.push('--human');
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
          `Permission denied. You may not have the required permissions to access filesystem usage for this project.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get filesystem usage: ${errorMessage}`
      );
    }
    
    // Parse JSON output
    try {
      const data = parseJsonOutput(result.stdout);
      
      if (!data || typeof data !== 'object') {
        return formatToolResponse(
          "error",
          "Unexpected output format from CLI command"
        );
      }
      
      // Format the data to match our expected structure
      const formattedData = {
        projectId: args.projectId,
        usage: data.usage || data,
        human: args.human || false,
        timestamp: new Date().toISOString()
      };
      
      return formatToolResponse(
        "success",
        `Filesystem usage for project ${args.projectId}`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "Filesystem usage retrieved (raw output)",
        {
          projectId: args.projectId,
          rawOutput: result.stdout,
          parseError: parseError instanceof Error ? parseError.message : String(parseError)
        }
      );
    }
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
