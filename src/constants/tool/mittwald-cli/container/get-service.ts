import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_get_service: Tool = {
  name: 'mittwald_container_get_service',
  description: 'Get details of a specific container service including its current status, configuration, and state',
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'ID of the stack the service belongs to'
      },
      serviceId: {
        type: 'string',
        description: 'ID of the service to retrieve'
      }
    },
    required: ['stackId', 'serviceId']
  }
};