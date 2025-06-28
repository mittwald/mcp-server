import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_server_get: Tool = {
  name: 'mittwald_server_get',
  description: 'Get a server. Retrieves detailed information about a specific server.',
  inputSchema: {
    type: 'object',
    properties: {
      serverId: {
        type: 'string',
        description: 'ID or short ID of a server; this argument is optional if a default server is set in the context'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (default: txt)'
      }
    },
    required: ['output'],
    additionalProperties: false
  }
};