import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldCronjobCreateCliArgs {
  description: string;
  interval: string;
  installationId?: string;
  email?: string;
  url?: string;
  command?: string;
  interpreter?: 'bash' | 'php';
  disable?: boolean;
  timeout?: string;
}

export const handleCronjobCreateCli: MittwaldToolHandler<MittwaldCronjobCreateCliArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['cronjob', 'create'];
    
    // Required flags
    cliArgs.push('--description', args.description);
    cliArgs.push('--interval', args.interval);
    
    // Optional flags
    if (args.installationId) {
      cliArgs.push('--installation-id', args.installationId);
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
    
    if (args.disable) {
      cliArgs.push('--disable');
    }
    
    if (args.timeout) {
      cliArgs.push('--timeout', args.timeout);
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('installation')) {
        return formatToolResponse(
          "error",
          `Installation not found. Please verify the installation ID: ${args.installationId || 'not specified'}.\nError: ${errorMessage}`
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
        `Failed to create cronjob: ${errorMessage}`
      );
    }
    
    // Return success with output
    return formatToolResponse(
      "success",
      `Cronjob created successfully`,
      {
        output: result.stdout,
        description: args.description,
        interval: args.interval
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};