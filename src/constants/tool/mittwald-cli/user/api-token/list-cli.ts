import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleUserApiTokenListCli } from '../../../../../handlers/tools/mittwald-cli/user/api-token/list-cli.js';

const tool: Tool = {
  name: 'mittwald_user_api_token_list',
  title: 'List My API Tokens',
  annotations: {
    title: 'List My API Tokens',
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description: 'List all API tokens of the user.. Shows all API tokens belonging to the current user.',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleUserApiTokenListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_user_api_token_list_cli = tool;