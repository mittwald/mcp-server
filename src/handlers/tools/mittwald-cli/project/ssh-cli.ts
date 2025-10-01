import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldProjectSshArgs {
  projectId: string;
  sshUser?: string;
  sshIdentityFile?: string;
}

function quote(value: string): string {
  return value.includes(' ') ? `"${value}"` : value;
}

function buildCliCommand(args: MittwaldProjectSshArgs): string {
  const cliArgs: string[] = ['mw', 'project', 'ssh', args.projectId];

  if (args.sshUser) cliArgs.push('--ssh-user', quote(args.sshUser));
  if (args.sshIdentityFile) cliArgs.push('--ssh-identity-file', quote(args.sshIdentityFile));

  return cliArgs.join(' ');
}

function buildInstructions(command: string): string {
  return `INTERACTIVE COMMAND: Project SSH\n\n` +
    'The project SSH command opens an interactive shell session on the project host and cannot be executed directly through the MCP interface.\n\n' +
    'To connect to your project via SSH, run the following command in your terminal:\n\n' +
    `${command}\n\n` +
    'Ensure you are authenticated with the Mittwald CLI (run `mw login` if needed).\n' +
    'This command will establish an SSH connection using your configured credentials. Use `exit` to close the session when finished.';
}

export const handleProjectSshCli: MittwaldCliToolHandler<MittwaldProjectSshArgs> = async (args) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required.');
  }

  try {
    const command = buildCliCommand(args);
    const instructions = buildInstructions(command);

    return formatToolResponse(
      'success',
      'SSH command prepared for interactive execution',
      {
        command,
        projectId: args.projectId,
        flags: {
          sshUser: args.sshUser,
          sshIdentityFile: args.sshIdentityFile,
        },
        interactive: true,
        instructions,
      },
      {
        command,
        durationMs: null,
      }
    );
  } catch (error) {
    return formatToolResponse(
      'error',
      `Failed to prepare SSH command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
