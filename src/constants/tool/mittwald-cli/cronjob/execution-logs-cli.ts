import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleCronjobExecutionLogsCli } from '../../../../handlers/tools/mittwald-cli/cronjob/execution-logs-cli.js';

const tool: Tool = {
  name: 'mittwald_cronjob_execution_logs',
  description: 'Get logs of a cronjob execution using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      cronjobId: {
        type: 'string',
        description: 'ID or short ID of a cronjob'
      },
      executionId: {
        type: 'string',
        description: 'ID of the execution to get logs for'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (txt, json, yaml)'
      },
      noPager: {
        type: 'boolean',
        description: 'Disable pager for output'
      }
    },
    required: ['cronjobId', 'executionId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleCronjobExecutionLogsCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_cronjob_execution_logs_cli = tool;