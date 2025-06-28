import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_get: Tool = {
  name: 'mittwald_app_get',
  description: 'Get details about an app installation',
  inputSchema: {
    type: 'object',
    properties: {
      installation_id: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context',
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output in a more machine friendly format',
        default: 'txt',
      },
    },
    required: [],
  },
};