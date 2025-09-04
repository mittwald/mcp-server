import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleUserSshKeyCreateCli } from '../../../../../handlers/tools/mittwald-cli/user/ssh-key/create-cli.js';

const tool: Tool = {
  name: 'mittwald_user_ssh_key_create',
  title: 'Create SSH Key',
  description: 'Create and import a new SSH key.. Generates a new SSH key pair and imports the public key.',
  inputSchema: {
    type: 'object',
    properties: {
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      expires: {
        type: 'string',
        description: 'An interval after which the SSH key expires (examples: 30m, 30d, 1y)'
      },
      output: {
        type: 'string',
        description: 'A filename in your ~/.ssh directory to write the SSH key to (default: mstudio-cli)'
      },
      noPassphrase: {
        type: 'boolean',
        description: 'Use this flag to not set a passphrase for the SSH key'
      },
      comment: {
        type: 'string',
        description: 'A comment for the SSH key'
      }
    },
    additionalProperties: false
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleUserSshKeyCreateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_user_ssh_key_create_cli = tool;