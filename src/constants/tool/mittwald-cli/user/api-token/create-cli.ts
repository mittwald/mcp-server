import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleUserApiTokenCreateCli } from '../../../../../handlers/tools/mittwald-cli/user/api-token/create-cli.js';

const tool: Tool = {
  name: 'mittwald_user_api_token_create',
  title: 'Create API Token',
  description: 'Create a new API token.. API tokens can be used to authenticate API requests.',
  inputSchema: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'Description of the API token'
      },
      roles: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['api_read', 'api_write']
        },
        description: 'Roles of the API token (at least one required: api_read, api_write)'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      expires: {
        type: 'string',
        description: 'An interval after which the API token expires (examples: 30m, 30d, 1y)'
      }
    },
    required: ['description', 'roles'],
    additionalProperties: false
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleUserApiTokenCreateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_user_api_token_create_cli = tool;