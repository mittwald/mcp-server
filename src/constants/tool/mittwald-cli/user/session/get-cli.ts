import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_user_session_get_cli: Tool = {
  name: 'mittwald_user_session_get_cli',
  description: 'Get a specific session using CLI wrapper. Retrieves information about a specific user session.',
  inputSchema: {
    type: 'object',
    properties: {
      tokenId: {
        type: 'string',
        description: 'Token ID to identify the specific session'
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