import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_get_cli: Tool = {
  name: 'mittwald_app_get_cli',
  description: 'Get details about an app installation using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      installationId: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format',
        default: 'txt'
      }
    }
  }
};