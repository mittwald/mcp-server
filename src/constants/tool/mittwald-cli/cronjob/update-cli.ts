import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleCronjobUpdateCli } from '../../../../handlers/tools/mittwald-cli/cronjob/update-cli.js';

const tool: Tool = {
  name: 'mittwald_cronjob_update',
  title: 'Update Cron Job',
  description: 'Update a cronjob.',
  inputSchema: {
    type: 'object',
    properties: {
      cronjobId: {
        type: 'string',
        description: 'ID or short ID of a cronjob'
      },
      description: {
        type: 'string',
        description: 'Description for the cronjob'
      },
      interval: {
        type: 'string',
        description: 'Cron expression for the interval'
      },
      email: {
        type: 'string',
        description: 'Email address to send cronjob output to'
      },
      url: {
        type: 'string',
        description: 'URL to call for the cronjob'
      },
      command: {
        type: 'string',
        description: 'Command to execute for the cronjob'
      },
      interpreter: {
        type: 'string',
        enum: ['bash', 'php'],
        description: 'Interpreter to use for the command'
      },
      enable: {
        type: 'boolean',
        description: 'Enable the cronjob'
      },
      disable: {
        type: 'boolean',
        description: 'Disable the cronjob'
      },
      timeout: {
        type: 'string',
        description: 'Timeout for the cronjob execution'
      }
    },
    required: ['cronjobId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleCronjobUpdateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_cronjob_update_cli = tool;