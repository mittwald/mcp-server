import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldBackupDownloadCliArgs {
  backupId: string;
  format?: 'tar' | 'zip';
  output?: string;
  password?: string;
  generatePassword?: boolean;
  promptPassword?: boolean;
  resume?: boolean;
  quiet?: boolean;
}

export const handleBackupDownloadCli: MittwaldCliToolHandler<MittwaldBackupDownloadCliArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['backup', 'download', args.backupId];
    
    // Optional flags
    if (args.format) {
      cliArgs.push('--format', args.format);
    }
    
    if (args.output) {
      cliArgs.push('--output', args.output);
    }
    
    if (args.password) {
      cliArgs.push('--password', args.password);
    }
    
    if (args.generatePassword) {
      cliArgs.push('--generate-password');
    }
    
    if (args.promptPassword) {
      cliArgs.push('--prompt-password');
    }
    
    if (args.resume) {
      cliArgs.push('--resume');
    }
    
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('backup')) {
        return formatToolResponse(
          "error",
          `Backup not found. Please verify the backup ID: ${args.backupId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('permission') || errorMessage.includes('access')) {
        return formatToolResponse(
          "error",
          `Permission denied. Please check your access rights. Error: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('file exists') || errorMessage.includes('already exists')) {
        return formatToolResponse(
          "error",
          `Output file already exists. Use --resume flag to resume download or specify a different output file. Error: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to download backup: ${errorMessage}`
      );
    }
    
    // Return success response
    return formatToolResponse(
      "success",
      `Backup ${args.backupId} downloaded successfully`,
      {
        backupId: args.backupId,
        format: args.format || 'tar',
        output: args.output || 'server-determined',
        downloadOutput: result.stdout
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
