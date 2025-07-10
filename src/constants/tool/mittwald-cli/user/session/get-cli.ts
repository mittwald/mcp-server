import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleUserSessionGetCli } from '../../../../../handlers/tools/mittwald-cli/user/session/get-cli.js';

const tool: Tool = {
  name: 'mittwald_user_session_get_cli',
  description: 'Get a specific session using CLI wrapper. Retrieves information about a specific user session.',
  inputSchema: {
    type: 'object',
    properties: {
      tokenId: {
        type: 'string',
        description: 'Token ID to identify the specific session'
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
  handler: handleUserSessionGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_user_session_get_cli = tool;