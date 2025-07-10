import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldBackupScheduleDeleteCliArgs {
  backupScheduleId: string;
  force?: boolean;
  quiet?: boolean;
}

export const handleBackupScheduleDeleteCli: MittwaldCliToolHandler<MittwaldBackupScheduleDeleteCliArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['backup', 'schedule', 'delete', args.backupScheduleId];
    
    // Optional flags
    if (args.force) {
      cliArgs.push('--force');
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
      
      if (errorMessage.includes('not found') && errorMessage.includes('schedule')) {
        return formatToolResponse(
          "error",
          `Backup schedule not found. Please verify the schedule ID: ${args.backupScheduleId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('cancelled') || errorMessage.includes('confirmation')) {
        return formatToolResponse(
          "error",
          `Backup schedule deletion cancelled. Use --force flag to skip confirmation. Error: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to delete backup schedule: ${errorMessage}`
      );
    }
    
    // Return success response
    return formatToolResponse(
      "success",
      `Backup schedule ${args.backupScheduleId} deleted successfully`,
      {
        backupScheduleId: args.backupScheduleId,
        deleted: true,
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