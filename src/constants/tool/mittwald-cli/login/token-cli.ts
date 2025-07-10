import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface LoginTokenCliParameters {
  token: string;
}

export const mittwald_login_token_cli: Tool = {
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