import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_recreate_cli: Tool = {
  name: 'mittwald_container_recreate_cli',
  description: 'Recreate a container (CLI wrapper)',
  inputSchema: {
    type: 'object',
    properties: {
      containerId: {
        type: 'string',
        description: 'ID or short ID of the container to recreate'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project (optional if default project is set in context)'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      pull: {
        type: 'boolean',
        description: 'Pull the container image before recreating the container'
      },
      force: {
        type: 'boolean',
        description: 'Also recreate the container when it is already up to date'
      }
    },
    required: ['containerId']
  }
};