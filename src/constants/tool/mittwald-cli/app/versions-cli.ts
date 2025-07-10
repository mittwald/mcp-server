import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_versions_cli: Tool = {
  name: 'mittwald_app_versions_cli',
  description: 'List supported Apps and Versions using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      app: {
        type: 'string',
        description: 'Name of specific app to get versions for'
      }
    }
  }
};