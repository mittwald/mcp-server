import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_user_get_cli: Tool = {
  name: 'mittwald_user_get_cli',
  description: 'Get profile information for a user using CLI wrapper. Defaults to the currently authenticated user if no user ID is provided.',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'The user ID to get information for; defaults to the special value "self", which references the currently authenticated user'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (default: txt)'
      }
    },
    additionalProperties: false
  }
};