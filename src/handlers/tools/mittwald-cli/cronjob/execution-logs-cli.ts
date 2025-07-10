import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldCronjobExecutionLogsCliArgs {
  cronjobId: string;
  executionId: string;
  output?: 'txt' | 'json' | 'yaml';
  noPager?: boolean;
}

export const handleCronjobExecutionLogsCli: MittwaldToolHandler<MittwaldCronjobExecutionLogsCliArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['cronjob', 'execution', 'logs', args.cronjobId, args.executionId];
    
    // Set output format - use json for structured parsing, txt for raw logs
    const outputFormat = args.output || 'txt';
    cliArgs.push('--output', outputFormat);
    
    // Optional flags
    if (args.noPager) {
      cliArgs.push('--no-pager');
    }
    
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
          `Cronjob or execution not found: ${args.cronjobId} / ${args.executionId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get cronjob execution logs: ${errorMessage}`
      );
    }
    
    // Handle different output formats
    if (outputFormat === 'json') {
      try {
        const data = parseJsonOutput(result.stdout);
        
        return formatToolResponse(
          "success",
          `Cronjob execution logs for ${args.executionId}`,
          {
            cronjobId: args.cronjobId,
            executionId: args.executionId,
            logs: data
          }
        );
        
      } catch (parseError) {
        // If JSON parsing fails, return the raw output
        return formatToolResponse(
          "success",
          "Cronjob execution logs retrieved (raw output)",
          {
            rawOutput: result.stdout,
            parseError: parseError instanceof Error ? parseError.message : String(parseError)
          }
        );
      }
    } else {
      // For txt/yaml format, return raw output
      return formatToolResponse(
        "success",
        `Cronjob execution logs for ${args.executionId}`,
        {
          cronjobId: args.cronjobId,
          executionId: args.executionId,
          logs: result.stdout,
          format: outputFormat
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