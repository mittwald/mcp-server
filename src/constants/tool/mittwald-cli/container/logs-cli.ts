import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleContainerLogsCli } from '../../../../handlers/tools/mittwald-cli/container/logs-cli.js';

const tool: Tool = {
  name: 'mittwald_container_logs',
  title: 'View Container Logs',
  description: 'Display logs of a specific container.',
  inputSchema: {
    type: 'object',
    properties: {
      containerId: {
        type: 'string',
        description: 'ID of the container for which to get logs'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project (optional if default project is set in context)'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (default: txt)'
      },
      noPager: {
        type: 'boolean',
        description: 'Disable pager for output (always true in CLI context)'
      }
    },
    required: ["containerId", "projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleContainerLogsCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_container_logs_cli = tool;