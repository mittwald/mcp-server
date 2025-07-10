import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldBackupDeleteCliArgs {
  backupId: string;
  force?: boolean;
  quiet?: boolean;
}

export const handleBackupDeleteCli: MittwaldToolHandler<MittwaldBackupDeleteCliArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['backup', 'delete', args.backupId];
    
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
      
      if (errorMessage.includes('not found') && errorMessage.includes('backup')) {
        return formatToolResponse(
          "error",
          `Backup not found. Please verify the backup ID: ${args.backupId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('cancelled') || errorMessage.includes('confirmation')) {
        return formatToolResponse(
          "error",
          `Backup deletion cancelled. Use --force flag to skip confirmation. Error: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to delete backup: ${errorMessage}`
      );
    }
    
    // Return success response
    return formatToolResponse(
      "success",
      `Backup ${args.backupId} deleted successfully`,
      {
        backupId: args.backupId,
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