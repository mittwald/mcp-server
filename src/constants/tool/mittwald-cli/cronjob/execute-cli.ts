import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleCronjobExecuteCli } from '../../../../handlers/tools/mittwald-cli/cronjob/execute-cli.js';

const tool: Tool = {
  name: 'mittwald_cronjob_execute',
  title: 'Execute Cron Job',
  description: 'Execute a cronjob.',
  inputSchema: {
    type: 'object',
    properties: {
      cronjobId: {
        type: 'string',
        description: 'ID or short ID of a cronjob'
      }
    },
    required: ['cronjobId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleCronjobExecuteCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_cronjob_execute_cli = tool;