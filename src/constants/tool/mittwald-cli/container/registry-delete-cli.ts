import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_registry_delete_cli: Tool = {
  name: 'mittwald_container_registry_delete_cli',
  description: 'Delete a container registry using CLI wrapper',
  inputSchema: {
    type: 'object',
    properties: {
      registryId: {
        type: 'string',
        description: 'ID of the registry to delete'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation'
      }
    },
    required: ['registryId']
  }
};