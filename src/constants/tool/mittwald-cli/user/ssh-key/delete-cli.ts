import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_user_ssh_key_delete_cli: Tool = {
  name: 'mittwald_user_ssh_key_delete_cli',
  description: 'Delete an SSH key using CLI wrapper. Permanently removes the specified SSH key.',
  inputSchema: {
    type: 'object',
    properties: {
      keyId: {
        type: 'string',
        description: 'ID of the SSH key to be deleted'
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
    required: ['keyId'],
    additionalProperties: false
  }
};