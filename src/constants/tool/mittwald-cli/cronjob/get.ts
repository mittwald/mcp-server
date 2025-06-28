import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldCronjobGet: Tool = {
  name: 'mittwald_cronjob_get',
  description: 'Get details of a cron job',
  inputSchema: {
    type: 'object',
    properties: {
      cronjobId: {
        type: 'string',
        description: 'ID of the cron job to be retrieved',
      },
      output: {
        type: 'string',
        description: 'Output format',
        enum: ['txt', 'json', 'yaml'],
        default: 'json',
      },
    },
    required: ['cronjobId'],
  },
};