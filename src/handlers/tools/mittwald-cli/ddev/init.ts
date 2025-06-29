import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCommand } from '../../../../utils/executeCommand.js';

export interface DdevInitArgs {
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

export const handleDdevInit: MittwaldToolHandler<DdevInitArgs> = async (args, { mittwaldClient }) => {
  try {
    // Build the command
    let command = "mw ddev init";
    
    if (args.directory) {
      command += ` --directory "${args.directory}"`;
    }
    
    if (args.appId) {
      command += ` --app-id "${args.appId}"`;
    }
    
    if (args.serverId) {
      command += ` --server-id "${args.serverId}"`;
    }
    
    if (args.projectId) {
      command += ` --project-id "${args.projectId}"`;
    }
    
    if (args.sshHost) {
      command += ` --ssh-host "${args.sshHost}"`;
    }
    
    if (args.sshUser) {
      command += ` --ssh-user "${args.sshUser}"`;
    }
    
    if (args.documentRoot) {
      command += ` --document-root "${args.documentRoot}"`;
    }
    
    if (args.ddevDirectory) {
      command += ` --ddev-directory "${args.ddevDirectory}"`;
    }
    
    if (args.workingCopy) {
      command += " --working-copy";
    }
    
    // Execute the command
    const { stdout, stderr } = await executeCommand(command);
    
    // Parse the output
    const output = stdout.trim();
    const error = stderr.trim();
    
    if (error) {
      throw new Error(`DDEV init failed: ${error}`);
    }
    
    // Parse ddev directory from output if available
    let ddevDirectory = null;
    const ddevDirMatch = output.match(/Created DDEV configuration in: (.+)/);
    if (ddevDirMatch) {
      ddevDirectory = ddevDirMatch[1];
    }
    
    const result = {
      success: true,
      message: "DDEV project initialized successfully",
      ddevDirectory: ddevDirectory,
      output: output || null,
      command: command
    };
    
    return formatToolResponse("success", JSON.stringify(result));
  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
};