import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldBackupScheduleUpdateCliArgs {
  backupScheduleId: string;
  description?: string;
  schedule?: string;
  ttl?: string;
  quiet?: boolean;
}

export const handleBackupScheduleUpdateCli: MittwaldCliToolHandler<MittwaldBackupScheduleUpdateCliArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['backup', 'schedule', 'update', args.backupScheduleId];
    
    // Optional flags
    if (args.description) {
      cliArgs.push('--description', args.description);
    }
    
    if (args.schedule) {
      cliArgs.push('--schedule', args.schedule);
    }
    
    if (args.ttl) {
      cliArgs.push('--ttl', args.ttl);
    }
    
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('schedule')) {
        return formatToolResponse(
          "error",
          `Backup schedule not found. Please verify the schedule ID: ${args.backupScheduleId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('invalid') && errorMessage.includes('schedule')) {
        return formatToolResponse(
          "error",
          `Invalid schedule format. Expected cron expression. Error: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('invalid') && errorMessage.includes('ttl')) {
        return formatToolResponse(
          "error",
          `Invalid TTL format. Expected format like '7d' (7-400 days). Error: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to update backup schedule: ${errorMessage}`
      );
    }
    
    // Return success response
    return formatToolResponse(
      "success",
      `Backup schedule ${args.backupScheduleId} updated successfully`,
      {
        backupScheduleId: args.backupScheduleId,
        description: args.description,
        schedule: args.schedule,
        ttl: args.ttl,
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
