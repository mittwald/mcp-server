import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_org: Tool = {
  name: "mittwald_org",
  description: "Manage your organizations, and also any kinds of user memberships concerning these organizations.",
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The org command to run",
        enum: ["delete", "get", "invite", "list", "membership"]
      },
      help: {
        type: "boolean",
        description: "Show help for org commands",
        default: false
      }
    },
    required: []
  }
};