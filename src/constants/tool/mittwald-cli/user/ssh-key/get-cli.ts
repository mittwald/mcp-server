import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_user_ssh_key_get_cli: Tool = {
  name: 'mittwald_user_ssh_key_get_cli',
  description: 'Get a specific SSH key using CLI wrapper. Retrieves information about a specific SSH key.',
  inputSchema: {
    type: 'object',
    properties: {
      keyId: {
        type: 'string',
        description: 'The ID of an SSH key'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (default: txt)'
      }
    },
    required: ['keyId'],
    additionalProperties: false
  }
};