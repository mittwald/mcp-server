import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleContainerRestartCli } from '../../../../handlers/tools/mittwald-cli/container/restart-cli.js';

const tool: Tool = {
  name: 'mittwald_container_restart',
  title: 'Restart Container',
  description: 'Restart a container.',
  inputSchema: {
    type: 'object',
    properties: {
      containerId: {
        type: 'string',
        description: 'ID or short ID of the container to restart'
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
    required: ['containerId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleContainerRestartCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_container_restart_cli = tool;