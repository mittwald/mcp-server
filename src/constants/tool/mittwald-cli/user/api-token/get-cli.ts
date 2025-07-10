import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_user_api_token_get_cli: Tool = {
  name: 'mittwald_user_api_token_get_cli',
  description: 'Get a specific API token using CLI wrapper. Retrieves information about a specific API token.',
  inputSchema: {
    type: 'object',
    properties: {
      tokenId: {
        type: 'string',
        description: 'The ID of an API token'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (default: txt)'
      }
    },
    required: ['tokenId'],
    additionalProperties: false
  }
};