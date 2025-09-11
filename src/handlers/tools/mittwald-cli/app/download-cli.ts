import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldAppDownloadArgs {
  installationId?: string;
  target: string;
  sshUser?: string;
  sshIdentityFile?: string;
  exclude?: string[];
  dryRun?: boolean;
  delete?: boolean;
  remoteSubDirectory?: string;
}

export const handleAppDownloadCli: MittwaldCliToolHandler<MittwaldAppDownloadArgs> = async (args) => {
  try {
    if (!args.installationId) {
      return formatToolResponse(
        "error",
        "Installation ID is required. Please provide the installationId parameter."
      );
    }

    if (!args.target) {
      return formatToolResponse(
        "error",
        "Target directory is required. Please provide the target parameter."
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['app', 'download'];
    
    // Add installation ID as positional argument
    cliArgs.push(args.installationId);
    
    // Add target directory
    cliArgs.push('--target', args.target);
    
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
    
    // Execute CLI command with extended timeout for downloads
    const result = await executeCli('mw', cliArgs, {
      timeout: 300000, // 5 minutes for download operations
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || '',
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
      
      return formatToolResponse(
        "error",
        `Failed to download app: ${errorMessage}`
      );
    }
    
    // Success response
    const output = result.stdout || result.stderr || 'App downloaded successfully';
    
    return formatToolResponse(
      "success",
      args.dryRun ? "Dry run completed successfully" : "App downloaded successfully",
      {
        installationId: args.installationId,
        target: args.target,
        remoteSubDirectory: args.remoteSubDirectory,
        dryRun: args.dryRun,
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