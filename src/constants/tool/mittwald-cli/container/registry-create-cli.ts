import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_registry_create_cli: Tool = {
  name: 'mittwald_container_registry_create_cli',
  description: 'Create a new container registry using CLI wrapper',
  inputSchema: {
    type: 'object',
    properties: {
      uri: {
        type: 'string',
        description: 'URI of the registry'
      },
      description: {
        type: 'string',
        description: 'Description of the registry'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      username: {
        type: 'string',
        description: 'Username for registry authentication'
      },
      password: {
        type: 'string',
        description: 'Password for registry authentication'
      }
    },
    required: ['uri', 'description']
  }
};