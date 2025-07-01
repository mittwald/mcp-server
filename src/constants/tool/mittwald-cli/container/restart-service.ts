import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_restart_service: Tool = {
  name: 'mittwald_container_restart_service',
  description: 'Restart a running container service. This will gracefully restart the service without recreating it.',
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'ID of the stack the service belongs to'
      },
      serviceId: {
        type: 'string',
        description: 'ID of the service to restart'
      }
    },
    required: ['stackId', 'serviceId']
  }
};