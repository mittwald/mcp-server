import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldProjectSshArgs {
  projectId: string;
  sshUser?: string;
  sshIdentityFile?: string;
}

export const handleProjectSshCli: MittwaldToolHandler<MittwaldProjectSshArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['project', 'ssh', args.projectId];
    
    // Optional flags
    if (args.sshUser) {
      cliArgs.push('--ssh-user', args.sshUser);
    }
    
    if (args.sshIdentityFile) {
      cliArgs.push('--ssh-identity-file', args.sshIdentityFile);
    }
    
    // Note: SSH is an interactive command, so we'll handle this differently
    // In an MCP context, we can't start an interactive SSH session
    // Instead, we'll provide connection information or an error
    
    return formatToolResponse(
      "error",
      "SSH connection cannot be established in this context. The SSH command requires an interactive terminal session. Please use this command directly in your terminal:\n" +
      `mw project ssh ${args.projectId}` + 
      (args.sshUser ? ` --ssh-user ${args.sshUser}` : '') +
      (args.sshIdentityFile ? ` --ssh-identity-file ${args.sshIdentityFile}` : ''),
      {
        command: `mw project ssh ${args.projectId}`,
        flags: {
          sshUser: args.sshUser,
          sshIdentityFile: args.sshIdentityFile
        },
        note: "This command must be run in an interactive terminal environment"
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to process SSH command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};