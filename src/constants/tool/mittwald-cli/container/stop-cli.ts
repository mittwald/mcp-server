import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleContainerStopCli } from '../../../../handlers/tools/mittwald-cli/container/stop-cli.js';

const tool: Tool = {
  name: 'mittwald_container_stop',
  title: 'Stop Container',
  description: 'Stop a running container.',
  inputSchema: {
    type: 'object',
    properties: {
      containerId: {
        type: 'string',
        description: 'ID or short ID of the container to stop'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project (optional if default project is set in context)'
      }
    },
    required: ["containerId", "projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleContainerStopCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_container_stop_cli = tool;