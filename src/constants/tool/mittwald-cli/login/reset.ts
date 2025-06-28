import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_login_reset: Tool = {
  name: "mittwald_login_reset",
  description: "Reset your login credentials for the Mittwald CLI.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};