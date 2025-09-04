import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleContainerDeleteCli } from '../../../../handlers/tools/mittwald-cli/container/delete-cli.js';

const tool: Tool = {
  name: 'mittwald_container_delete',
  title: 'Delete Container',
  description: 'Delete a container.',
  inputSchema: {
    type: 'object',
    properties: {
      containerId: {
        type: 'string',
        description: 'ID or short ID of the container to delete'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project (optional if default project is set in context)'
      },
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation'
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
  handler: handleContainerDeleteCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_container_delete_cli = tool;