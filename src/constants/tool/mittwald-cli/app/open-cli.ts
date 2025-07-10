import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_open_cli: Tool = {
  name: 'mittwald_app_open_cli',
  description: 'Open an app installation in the browser using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      installationId: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context'
      }
    }
  }
};