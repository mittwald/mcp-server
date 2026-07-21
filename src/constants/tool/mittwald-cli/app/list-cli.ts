import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleAppListCli } from '../../../../handlers/tools/mittwald-cli/app/list-cli.js';

const tool: Tool = {
  name: 'mittwald_app_list',
  title: 'List Apps',
  annotations: {
    title: 'List Apps',
    readOnlyHint: true,
    destructiveHint: false,
  },
  description: 'List installed apps in a project.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this flag is optional if a default project is set in the context'
      }
    },
    required: ['projectId']
  }
  };

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleAppListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_app_list_cli = tool;
