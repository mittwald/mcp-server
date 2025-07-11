import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldCronjobGetCliArgs {
  cronjobId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleCronjobGetCli: MittwaldToolHandler<MittwaldCronjobGetCliArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['cronjob', 'get', args.cronjobId];
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Cronjob not found: ${args.cronjobId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get cronjob: ${errorMessage}`
      );
    }
    
    // Parse JSON output
    try {
      const data = parseJsonOutput(result.stdout);
      
      // Format the data to match our expected structure
      const formattedData = {
        id: data.id,
        description: data.description,
        expression: data.expression,
        command: data.command,
        enabled: data.enabled,
        projectId: data.projectId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        lastExecutedAt: data.lastExecutedAt
      };
      
      return formatToolResponse(
        "success",
        `Cronjob details for ${data.id}`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "Cronjob retrieved (raw output)",
        {
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