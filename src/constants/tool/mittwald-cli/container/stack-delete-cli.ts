import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_stack_delete_cli: Tool = {
  name: 'mittwald_container_stack_delete_cli',
  description: 'Delete a container stack using CLI wrapper',
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'ID of a stack'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation'
      },
      withVolumes: {
        type: 'boolean',
        description: 'Also include remove volumes in removal'
      }
    },
    required: []
  }
};