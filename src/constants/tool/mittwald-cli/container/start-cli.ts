import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_start_cli: Tool = {
  name: 'mittwald_container_start_cli',
  description: 'Start a stopped container (CLI wrapper)',
  inputSchema: {
    type: 'object',
    properties: {
      containerId: {
        type: 'string',
        description: 'ID or short ID of the container to start'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project (optional if default project is set in context)'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      }
    },
    required: ['containerId']
  }
};