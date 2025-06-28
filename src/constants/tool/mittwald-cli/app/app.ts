import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app: Tool = {
  name: "mittwald_app",
  description: "Manage apps, and app installations in your projects. This is a parent command that provides access to app-related subcommands.",
  inputSchema: {
    type: "object",
    properties: {
      help: {
        type: "boolean",
        description: "Show help for the app command"
      }
    },
    required: []
  }
};