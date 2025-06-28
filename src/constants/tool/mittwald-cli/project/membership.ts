import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_membership: Tool = {
  name: "mittwald_project_membership",
  description: "Control who gets to work on your projects, and who doesn't. This is a parent command that provides information about available membership subcommands.",
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "Show help for specific subcommand",
        enum: ["get", "get-own", "list", "list-own"]
      }
    },
    required: []
  }
};