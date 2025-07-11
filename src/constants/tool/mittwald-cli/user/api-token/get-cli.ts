import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleUserApiTokenGetCli } from '../../../../../handlers/tools/mittwald-cli/user/api-token/get-cli.js';

const tool: Tool = {
  name: 'mittwald_user_api_token_get',
  description: 'Get a specific API token using CLI wrapper. Retrieves information about a specific API token.',
  inputSchema: {
    type: 'object',
    properties: {
      tokenId: {
        type: 'string',
        description: 'The ID of an API token'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (default: txt)'
      }
    },
    required: ['tokenId'],
    additionalProperties: false
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleUserApiTokenGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_user_api_token_get_cli = tool;