import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_recreate_service: Tool = {
  name: 'mittwald_container_recreate_service',
  description: 'Recreate/rebuild a container service. This will destroy the existing container and create a new one with the same configuration.',
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'ID of the stack the service belongs to'
      },
      serviceId: {
        type: 'string',
        description: 'ID of the service to recreate'
      }
    },
    required: ['stackId', 'serviceId']
  }
};