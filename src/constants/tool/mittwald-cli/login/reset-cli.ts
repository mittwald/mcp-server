import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface LoginResetCliParameters {
  // No specific parameters needed for reset
}

export const mittwald_login_reset_cli: Tool = {
  name: 'mittwald_login_reset_cli',
  description: 'Reset login session using CLI wrapper',
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};