import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_get_service_logs: Tool = {
  name: 'mittwald_container_get_service_logs',
  description: 'Get logs from a container service',
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'ID of the stack containing the service'
      },
      serviceId: {
        type: 'string',
        description: 'ID of the service'
      },
      since: {
        type: 'string',
        description: 'Show logs since timestamp (RFC3339 format)'
      },
      until: {
        type: 'string',
        description: 'Show logs until timestamp (RFC3339 format)'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of log lines to return'
      },
      follow: {
        type: 'boolean',
        description: 'Follow log output (not supported in MCP context)'
      }
    },
    required: ['stackId', 'serviceId']
  }
};