import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleUserApiTokenRevokeCli } from '../../../../../handlers/tools/mittwald-cli/user/api-token/revoke-cli.js';

const tool: Tool = {
  name: 'mittwald_user_api_token_revoke',
  title: 'Revoke API Token',
  description: 'Revoke an API token.. Permanently disables the specified API token.',
  inputSchema: {
    type: 'object',
    properties: {
      tokenId: {
        type: 'string',
        description: 'ID of the API token to revoke'
      },
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm revocation (DESTRUCTIVE OPERATION - cannot be undone).'
      },
      force: {
        type: 'boolean',
        description: 'Pass --force to the CLI to override safety prompts after confirm=true is provided.'
      },
    },
    required: ['tokenId', 'confirm'],
    additionalProperties: false
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleUserApiTokenRevokeCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_user_api_token_revoke_cli = tool;
