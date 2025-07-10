import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleUserSshKeyGetCli } from '../../../../../handlers/tools/mittwald-cli/user/ssh-key/get-cli.js';

const tool: Tool = {
  name: 'mittwald_user_ssh_key_get_cli',
  description: 'Get a specific SSH key using CLI wrapper. Retrieves information about a specific SSH key.',
  inputSchema: {
    type: 'object',
    properties: {
      keyId: {
        type: 'string',
        description: 'The ID of an SSH key'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (default: txt)'
      }
    },
    required: ['keyId'],
    additionalProperties: false
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleUserSshKeyGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_user_ssh_key_get_cli = tool;