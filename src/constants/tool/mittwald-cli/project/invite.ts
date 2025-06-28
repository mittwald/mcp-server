import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_invite: Tool = {
  name: "mittwald_project_invite",
  description: "Invite users to your projects and manage their invitations. This is a parent command that provides information about available invite subcommands.",
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "Show help for specific subcommand",
        enum: ["get", "list", "list-own"]
      }
    },
    required: []
  }
};