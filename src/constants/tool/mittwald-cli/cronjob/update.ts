import { McpTool } from '@/types/mcp';

export const mittwaldCronjobUpdate: McpTool = {
  name: 'mittwald_cronjob_update',
  description: 'Update an existing cron job',
  inputSchema: {
    type: 'object',
    properties: {
      cronjobId: {
        type: 'string',
        description: 'ID of the cron job to be updated',
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary',
      },
      description: {
        type: 'string',
        description: 'Set cron job description',
      },
      interval: {
        type: 'string',
        description: 'Set the interval for cron jobs to run (cron schedule expression)',
      },
      email: {
        type: 'string',
        description: 'Set the target email to which error messages will be sent',
      },
      url: {
        type: 'string',
        description: 'Set the URL to use when running a cron job',
      },
      command: {
        type: 'string',
        description: 'Specify the file and arguments to be executed when the cron job is run',
      },
      interpreter: {
        type: 'string',
        description: 'Set the interpreter to be used for execution',
        enum: ['bash', 'php'],
      },
      enable: {
        type: 'boolean',
        description: 'Enable the cron job',
      },
      disable: {
        type: 'boolean',
        description: 'Disable the cron job',
      },
      timeout: {
        type: 'string',
        description: 'Timeout after which the process will be killed (duration format like 1h, 30m, 30s)',
      },
    },
    required: ['cronjobId'],
  },
};