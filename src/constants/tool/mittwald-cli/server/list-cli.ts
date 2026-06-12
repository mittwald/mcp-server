import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleServerListCli } from '../../../../handlers/tools/mittwald-cli/server/list-cli.js';

const tool: Tool = {
  name: 'mittwald_server_list',
  title: 'List Servers',
  description: 'List servers for an organization or user.. Shows all servers accessible to the current user.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleServerListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_server_list_cli = tool;