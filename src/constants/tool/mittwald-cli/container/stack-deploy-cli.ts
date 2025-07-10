import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_stack_deploy_cli: Tool = {
  name: 'mittwald_container_stack_deploy_cli',
  description: 'Deploy a docker-compose compatible file to a mittwald container stack using CLI wrapper',
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
      composeFile: {
        type: 'string',
        description: 'Path to a compose file, or "-" to read from stdin'
      },
      envFile: {
        type: 'string',
        description: 'Alternative path to file with environment variables'
      }
    },
    required: []
  }
};