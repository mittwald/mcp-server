import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleCronjobCreateCli } from '../../../../handlers/tools/mittwald-cli/cronjob/create-cli.js';

const tool: Tool = {
  name: 'mittwald_cronjob_create',
  title: 'Create Cron Job',
  description: 'Create a cronjob.',
  inputSchema: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'Description for the cronjob'
      },
      interval: {
        type: 'string',
        description: 'Cron expression for the interval'
      },
      installationId: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
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
      disable: {
        type: 'boolean',
        description: 'Create the cronjob in disabled state'
      },
      timeout: {
        type: 'string',
        description: 'Timeout for the cronjob execution'
      }
    },
    required: ['description', 'interval']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleCronjobCreateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_cronjob_create_cli = tool;