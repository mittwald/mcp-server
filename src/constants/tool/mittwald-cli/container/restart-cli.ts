import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_restart_cli: Tool = {
  name: 'mittwald_container_restart_cli',
  description: 'Restart a container (CLI wrapper)',
  inputSchema: {
    type: 'object',
    properties: {
      containerId: {
        type: 'string',
        description: 'ID or short ID of the container to restart'
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