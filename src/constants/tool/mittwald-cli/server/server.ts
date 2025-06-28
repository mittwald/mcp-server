import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_server: Tool = {
  name: 'mittwald_server',
  description: 'Manage your servers. Shows available server commands and help information.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false
  }
};