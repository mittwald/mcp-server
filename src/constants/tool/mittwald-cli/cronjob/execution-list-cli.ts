import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleCronjobExecutionListCli } from '../../../../handlers/tools/mittwald-cli/cronjob/execution-list-cli.js';

const tool: Tool = {
  name: 'mittwald_cronjob_execution_list',
  title: 'List Cron Job Executions',
  description: 'List cronjob executions.',
  inputSchema: {
    type: 'object',
    properties: {
      cronjobId: {
        type: 'string',
        description: 'ID of the cronjob'
      }
    },
    required: ['cronjobId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleCronjobExecutionListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_cronjob_execution_list_cli = tool;