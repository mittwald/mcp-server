import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_logs_cli: Tool = {
  name: 'mittwald_container_logs_cli',
  description: 'Display logs of a specific container (CLI wrapper)',
  inputSchema: {
    type: 'object',
    properties: {
      containerId: {
        type: 'string',
        description: 'ID of the container for which to get logs'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project (optional if default project is set in context)'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (default: txt)'
      },
      noPager: {
        type: 'boolean',
        description: 'Disable pager for output (always true in CLI context)'
      }
    },
    required: ['containerId']
  }
};