import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleContainerListCli } from '../../../../handlers/tools/mittwald-cli/container/list-services-cli.js';

const tool: Tool = {
  name: 'mittwald_container_list',
  title: 'List Containers',
  annotations: {
    title: 'List Containers',
    readOnlyHint: true,
    destructiveHint: false,
  },
  description: 'List containers belonging to a project.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project'
      }
    },
    required: ["projectId"]
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleContainerListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_container_list_cli = tool;