import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_create: Tool = {
  name: "mittwald_app_create",
  description: "Base command for creating apps - shows available subcommands",
  inputSchema: {
    type: "object",
    properties: {
      help: {
        type: "boolean",
        description: "Show available app creation subcommands"
      }
    },
    required: []
  }
};