import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleContainerRecreateCli } from '../../../../handlers/tools/mittwald-cli/container/recreate-cli.js';

const tool: Tool = {
  name: 'mittwald_container_recreate',
  title: 'Recreate Container',
  description: 'Recreate a container.',
  inputSchema: {
    type: 'object',
    properties: {
      containerId: {
        type: 'string',
        description: 'ID or short ID of the container to recreate'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project (optional if default project is set in context)'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      pull: {
        type: 'boolean',
        description: 'Pull the container image before recreating the container'
      },
      force: {
        type: 'boolean',
        description: 'Also recreate the container when it is already up to date'
      }
    },
    required: ["containerId", "projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleContainerRecreateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_container_recreate_cli = tool;