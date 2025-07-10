import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_user_api_token_revoke_cli: Tool = {
  name: 'mittwald_user_api_token_revoke_cli',
  description: 'Revoke an API token using CLI wrapper. Permanently disables the specified API token.',
  inputSchema: {
    type: 'object',
    properties: {
      tokenId: {
        type: 'string',
        description: 'ID of the API token to revoke'
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
    required: ['tokenId'],
    additionalProperties: false
  }
};