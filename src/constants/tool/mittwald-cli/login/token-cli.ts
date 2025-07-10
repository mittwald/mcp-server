import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleLoginTokenCli } from '../../../../handlers/tools/mittwald-cli/login/token-cli.js';

export interface LoginTokenCliParameters {
  token: string;
}

const tool: Tool = {
  name: 'mittwald_login_token_cli',
  description: 'Login using API token with CLI wrapper',
  inputSchema: {
    type: "object",
    properties: {
      token: {
        type: "string",
        description: 'The API token to use for authentication'
      }
    },
    required: ["token"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleLoginTokenCli,
  schema: tool.inputSchema
};

export default registration;