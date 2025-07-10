import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldAppSshArgs {
  installationId?: string;
  sshUser?: string;
  sshIdentityFile?: string;
  cd?: boolean;
  info?: boolean;
  test?: boolean;
}

export const handleAppSshCli: MittwaldToolHandler<MittwaldAppSshArgs> = async (args) => {
  try {
    if (!args.installationId) {
      return formatToolResponse(
        "error",
        "Installation ID is required. Please provide the installationId parameter."
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['app', 'ssh'];
    
    // Add installation ID as positional argument
    cliArgs.push(args.installationId);
    
    // Add optional flags
    if (args.sshUser) {
      cliArgs.push('--ssh-user', args.sshUser);
    }
    
    if (args.sshIdentityFile) {
      cliArgs.push('--ssh-identity-file', args.sshIdentityFile);
    }
    
    if (args.cd !== undefined) {
      cliArgs.push(args.cd ? '--cd' : '--no-cd');
    }
    
    if (args.info) {
      cliArgs.push('--info');
    }
    
    if (args.test) {
      cliArgs.push('--test');
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
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
      
      if (errorMessage.includes('SSH')) {
        return formatToolResponse(
          "error",
          `SSH connection failed. Please check your SSH configuration and credentials.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to connect via SSH: ${errorMessage}`
      );
    }
    
    // Success response
    const output = result.stdout || result.stderr || 'SSH operation completed';
    
    let message = "SSH operation completed successfully";
    if (args.info) {
      message = "SSH connection information retrieved";
    } else if (args.test) {
      message = "SSH connection test completed successfully";
    }
    
    return formatToolResponse(
      "success",
      message,
      {
        installationId: args.installationId,
        sshUser: args.sshUser,
        info: args.info,
        test: args.test,
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