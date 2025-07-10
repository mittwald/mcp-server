import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_registry_update_cli: Tool = {
  name: 'mittwald_container_registry_update_cli',
  description: 'Update an existing container registry using CLI wrapper',
  inputSchema: {
    type: 'object',
    properties: {
      registryId: {
        type: 'string',
        description: 'ID of the registry to update'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      description: {
        type: 'string',
        description: 'New description for the registry'
      },
      uri: {
        type: 'string',
        description: 'New URI for the registry'
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
    required: ['registryId']
  }
};