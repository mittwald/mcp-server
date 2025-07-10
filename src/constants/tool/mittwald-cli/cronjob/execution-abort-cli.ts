import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleCronjobExecutionAbortCli } from '../../../../handlers/tools/mittwald-cli/cronjob/execution-abort-cli.js';

const tool: Tool = {
  name: 'mittwald_cronjob_execution_abort',
  description: 'Abort a cronjob execution using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      cronjobId: {
        type: 'string',
        description: 'ID or short ID of a cronjob'
      },
      executionId: {
        type: 'string',
        description: 'ID of the execution to abort'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      }
    },
    required: ['cronjobId', 'executionId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleCronjobExecutionAbortCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_cronjob_execution_abort_cli = tool;