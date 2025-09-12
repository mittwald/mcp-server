import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldAppUploadArgs {
  installationId?: string;
  source: string;
  sshUser?: string;
  sshIdentityFile?: string;
  exclude?: string[];
  dryRun?: boolean;
  delete?: boolean;
  remoteSubDirectory?: string;
}

export const handleAppUploadCli: MittwaldCliToolHandler<MittwaldAppUploadArgs> = async (args) => {
  try {
    if (!args.installationId) {
      return formatToolResponse(
        "error",
        "Installation ID is required. Please provide the installationId parameter."
      );
    }

    if (!args.source) {
      return formatToolResponse(
        "error",
        "Source directory is required. Please provide the source parameter."
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['app', 'upload'];
    
    // Add installation ID as positional argument
    cliArgs.push(args.installationId);
    
    // Add source directory
    cliArgs.push('--source', args.source);
    
    // Add optional flags
    
    if (args.sshUser) {
      cliArgs.push('--ssh-user', args.sshUser);
    }
    
    if (args.sshIdentityFile) {
      cliArgs.push('--ssh-identity-file', args.sshIdentityFile);
    }
    
    if (args.exclude && args.exclude.length > 0) {
      args.exclude.forEach(pattern => {
        cliArgs.push('--exclude', pattern);
      });
    }
    
    if (args.dryRun) {
      cliArgs.push('--dry-run');
    }
    
    if (args.delete) {
      cliArgs.push('--delete');
    }
    
    if (args.remoteSubDirectory) {
      cliArgs.push('--remote-sub-directory', args.remoteSubDirectory);
    }
    
    // Execute CLI command with extended timeout for uploads
    const result = await executeCli('mw', cliArgs, {
      timeout: 600000, // 10 minutes for upload operations
      env: {
        MITTWALD_NONINTERACTIVE: '1'
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('installation')) {
        return formatToolResponse(
          "error",
          `App installation not found. Please verify the installation ID: ${args.installationId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('rsync')) {
        return formatToolResponse(
          "error",
          `rsync is required but not available. Please install rsync on your system.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('source') && errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Source directory not found: ${args.source}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to upload app: ${errorMessage}`
      );
    }
    
    // Success response
    const output = result.stdout || result.stderr || 'App uploaded successfully';
    
    return formatToolResponse(
      "success",
      args.dryRun ? "Dry run completed successfully" : "App uploaded successfully",
      {
        installationId: args.installationId,
        source: args.source,
        remoteSubDirectory: args.remoteSubDirectory,
        dryRun: args.dryRun,
        delete: args.delete,
        output: output
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
