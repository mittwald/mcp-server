import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_get_stack: Tool = {
  name: 'mittwald_container_get_stack',
  description: 'Get details of a container stack including all its services and volumes',
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'ID of the stack to retrieve'
      }
    },
    required: ['stackId']
  }
};