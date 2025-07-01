import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_stop_service: Tool = {
  name: 'mittwald_container_stop_service',
  description: 'Stop a running container service',
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'ID of the stack the service belongs to'
      },
      serviceId: {
        type: 'string',
        description: 'ID of the service to stop'
      }
    },
    required: ['stackId', 'serviceId']
  }
};