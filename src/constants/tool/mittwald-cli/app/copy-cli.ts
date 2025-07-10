import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_copy_cli: Tool = {
  name: 'mittwald_app_copy_cli',
  description: 'Copy an app within a project using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      installationId: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context'
      },
      description: {
        type: 'string',
        description: 'Set a description for the new app installation'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      }
    },
    required: ['description']
  }
};