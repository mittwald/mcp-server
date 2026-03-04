import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleContainerLogsCli } from '../../../../handlers/tools/mittwald-cli/container/logs-cli.js';

const tool: Tool = {
  name: 'mittwald_container_logs',
  title: 'View Container Logs',
  description: 'Display logs of a specific container. Use mittwald_container_list to find the containerId for your container.',
  inputSchema: {
    type: 'object',
    properties: {
      containerId: {
        type: 'string',
        description: 'ID of the container to get logs for'
      },
      projectId: {
        type: 'string',
        description: 'ID of the project containing the container'
      },
      tail: {
        type: 'number',
        description: 'Number of most recent log lines to retrieve (optional, returns all logs if not specified)'
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