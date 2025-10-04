import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleUserSshKeyDeleteCli } from '../../../../../handlers/tools/mittwald-cli/user/ssh-key/delete-cli.js';

const tool: Tool = {
  name: 'mittwald_user_ssh_key_delete',
  title: 'Delete SSH Key',
  description: 'Delete an SSH key.. Permanently removes the specified SSH key.',
  inputSchema: {
    type: 'object',
    properties: {
      keyId: {
        type: 'string',
        description: 'ID of the SSH key to be deleted'
      },
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone).'
      },
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      }
    },
    required: ['keyId', 'confirm'],
    additionalProperties: false
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleUserSshKeyDeleteCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_user_ssh_key_delete_cli = tool;
