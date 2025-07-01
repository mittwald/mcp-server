import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_pull_image: Tool = {
  name: 'mittwald_container_pull_image',
  description: 'Pull the latest image for a container service. Useful when you want to update to the latest version of an image without recreating the service.',
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'ID of the stack the service belongs to'
      },
      serviceId: {
        type: 'string',
        description: 'ID of the service to pull the image for'
      }
    },
    required: ['stackId', 'serviceId']
  }
};