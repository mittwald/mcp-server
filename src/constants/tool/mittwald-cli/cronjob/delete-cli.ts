import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleCronjobDeleteCli } from '../../../../handlers/tools/mittwald-cli/cronjob/delete-cli.js';

const tool: Tool = {
  name: 'mittwald_cronjob_delete',
  title: 'Delete Cron Job',
  description: 'Delete a cronjob.',
  inputSchema: {
    type: 'object',
    properties: {
      cronjobId: {
        type: 'string',
        description: 'ID or short ID of a cronjob'
      },
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone).'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      force: {
        type: 'boolean',
        description: 'Skip confirmation prompt'
      }
    },
    required: ['cronjobId', 'confirm']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleCronjobDeleteCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_cronjob_delete_cli = tool;
