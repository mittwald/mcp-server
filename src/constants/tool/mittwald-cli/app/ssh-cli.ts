import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleAppSshCli } from '../../../../handlers/tools/mittwald-cli/app/ssh-cli.js';

const tool: Tool = {
  name: 'mittwald_app_ssh',
  title: 'Get App SSH Connection Data',
  annotations: {
    title: 'Get App SSH Connection Data',
    readOnlyHint: true,
    destructiveHint: false,
  },
  description:
    'Get the SSH connection data (host, user, document root) for an app installation, plus a ready-to-run ssh command. ' +
    'This tool does not open a session itself - run the returned command locally to connect.',
  inputSchema: {
    type: 'object',
    properties: {
      installationId: {
        type: 'string',
        description: 'ID or short ID of an app installation'
      },
      sshUser: {
        type: 'string',
        description: 'Override the SSH user to connect with; if omitted, your own mStudio user will be used'
      },
      sshIdentityFile: {
        type: 'string',
        description: 'The SSH identity file (private key) to include in the returned ssh command'
      }
    },
    required: ['installationId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppSshCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_app_ssh_cli = tool;
