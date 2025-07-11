import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleUserGetCli } from '../../../../handlers/tools/mittwald-cli/user/get-cli.js';

const tool: Tool = {
  name: 'mittwald_user_get',
  description: 'Get profile information for a user using CLI wrapper. Defaults to the currently authenticated user if no user ID is provided.',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'The user ID to get information for; defaults to the special value "self", which references the currently authenticated user'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (default: txt)'
      }
    },
    additionalProperties: false
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleUserGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_user_get_cli = tool;