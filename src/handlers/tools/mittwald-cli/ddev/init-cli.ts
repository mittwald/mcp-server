import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldDdevInitArgs {
  directory?: string;
  appId?: string;
  serverId?: string;
  projectId?: string;
  sshHost?: string;
  sshUser?: string;
  documentRoot?: string;
  ddevDirectory?: string;
  workingCopy?: boolean;
}

export const handleDdevInitCli: MittwaldCliToolHandler<MittwaldDdevInitArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['ddev', 'init'];
    
    // Add optional parameters
    if (args.directory) {
      cliArgs.push('--directory', args.directory);
    }
    
    if (args.appId) {
      cliArgs.push('--app-id', args.appId);
    }
    
    if (args.serverId) {
      cliArgs.push('--server-id', args.serverId);
    }
    
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    if (args.sshHost) {
      cliArgs.push('--ssh-host', args.sshHost);
    }
    
    if (args.sshUser) {
      cliArgs.push('--ssh-user', args.sshUser);
    }
    
    if (args.documentRoot) {
      cliArgs.push('--document-root', args.documentRoot);
    }
    
    if (args.ddevDirectory) {
      cliArgs.push('--ddev-directory', args.ddevDirectory);
    }
    
    if (args.workingCopy) {
      cliArgs.push('--working-copy');
    }
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Handle specific error cases
      if (errorMessage.includes('directory already exists')) {
        return formatToolResponse(
          "error",
          `DDEV directory already exists: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Resource not found: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `DDEV init failed: ${errorMessage}`
      );
    }
    
    // Parse success output
    const output = result.stdout.trim();
    
    // Parse ddev directory from output if available
    let ddevDirectory = null;
    const ddevDirMatch = output.match(/Created DDEV configuration in: (.+)/);
    if (ddevDirMatch) {
      ddevDirectory = ddevDirMatch[1];
    }
    
    const responseData = {
      success: true,
      message: "DDEV project initialized successfully",
      ddevDirectory: ddevDirectory,
      output: output || null,
      timestamp: new Date().toISOString()
    };
    
    return formatToolResponse(
      "success",
      "DDEV project initialized successfully",
      responseData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
