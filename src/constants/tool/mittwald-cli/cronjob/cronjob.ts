import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_cronjob_cronjob: Tool = {
  name: 'mittwald_cronjob',
  description: 'Manage cronjobs of your projects - shows available cronjob commands',
  inputSchema: {
    type: 'object',
    properties: {
      help: {
        type: 'boolean',
        description: 'Show help for cronjob commands',
        default: true,
      },
    },
    required: [],
  },
};