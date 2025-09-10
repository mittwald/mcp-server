import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleContainerStartCli } from '../../../../handlers/tools/mittwald-cli/container/start-cli.js';

const tool: Tool = {
  name: 'mittwald_container_start',
  title: 'Start Container',
  description: 'Start a stopped container.',
  inputSchema: {
    type: 'object',
    properties: {
      containerId: {
        type: 'string',
        description: 'ID or short ID of the container to start'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project (optional if default project is set in context)'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      }
    },
    required: ["containerId", "projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleContainerStartCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_container_start_cli = tool;