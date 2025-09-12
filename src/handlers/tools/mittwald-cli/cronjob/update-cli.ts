import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldCronjobUpdateCliArgs {
  cronjobId: string;
  description?: string;
  interval?: string;
  email?: string;
  url?: string;
  command?: string;
  interpreter?: 'bash' | 'php';
  enable?: boolean;
  disable?: boolean;
  timeout?: string;
}

export const handleCronjobUpdateCli: MittwaldToolHandler<MittwaldCronjobUpdateCliArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['cronjob', 'update', args.cronjobId];
    
    // Optional flags
    
    if (args.description) {
      cliArgs.push('--description', args.description);
    }
    
    if (args.interval) {
      cliArgs.push('--interval', args.interval);
    }
    
    if (args.email) {
      cliArgs.push('--email', args.email);
    }
    
    if (args.url) {
      cliArgs.push('--url', args.url);
    }
    
    if (args.command) {
      cliArgs.push('--command', args.command);
    }
    
    if (args.interpreter) {
      cliArgs.push('--interpreter', args.interpreter);
    }
    
    if (args.enable) {
      cliArgs.push('--enable');
    }
    
    if (args.disable) {
      cliArgs.push('--disable');
    }
    
    if (args.timeout) {
      cliArgs.push('--timeout', args.timeout);
    }
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Cronjob not found: ${args.cronjobId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('invalid cron expression')) {
        return formatToolResponse(
          "error",
          `Invalid cron expression: ${args.interval}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to update cronjob: ${errorMessage}`
      );
    }
    
    // Return success
    return formatToolResponse(
      "success",
      `Cronjob updated successfully`,
      {
        cronjobId: args.cronjobId,
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
