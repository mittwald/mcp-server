import { McpTool } from '@/types/mcp';

export const mittwaldCronjob: McpTool = {
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