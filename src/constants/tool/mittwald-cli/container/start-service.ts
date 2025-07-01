import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_start_service: Tool = {
  name: 'mittwald_container_start_service',
  description: 'Start a stopped container service',
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'ID of the stack the service belongs to'
      },
      serviceId: {
        type: 'string',
        description: 'ID of the service to start'
      }
    },
    required: ['stackId', 'serviceId']
  }
};