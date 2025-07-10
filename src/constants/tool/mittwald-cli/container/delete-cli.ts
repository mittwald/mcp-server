import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_delete_cli: Tool = {
  name: 'mittwald_container_delete_cli',
  description: 'Delete a container (CLI wrapper)',
  inputSchema: {
    type: 'object',
    properties: {
      containerId: {
        type: 'string',
        description: 'ID or short ID of the container to delete'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project (optional if default project is set in context)'
      },
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      }
    },
    required: ['containerId']
  }
};