import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleCronjobExecutionGetCli } from '../../../../handlers/tools/mittwald-cli/cronjob/execution-get-cli.js';

const tool: Tool = {
  name: 'mittwald_cronjob_execution_get',
  title: 'Get Cron Job Execution Details',
  description: 'Get details of a cronjob execution.',
  inputSchema: {
    type: 'object',
    properties: {
      cronjobId: {
        type: 'string',
        description: 'ID or short ID of a cronjob'
      },
      executionId: {
        type: 'string',
        description: 'ID of the execution to get details for'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (txt, json, yaml)'
      }
    },
    required: ['cronjobId', 'executionId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleCronjobExecutionGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_cronjob_execution_get_cli = tool;