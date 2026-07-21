import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleUserSshKeyListCli } from '../../../../../handlers/tools/mittwald-cli/user/ssh-key/list-cli.js';

const tool: Tool = {
  name: 'mittwald_user_ssh_key_list',
  title: 'List My SSH Keys',
  description: 'Get your stored SSH keys.. Lists all SSH keys for the current user.',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleUserSshKeyListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_user_ssh_key_list_cli = tool;