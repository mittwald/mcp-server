import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_org_membership: Tool = {
  name: "mittwald_org_membership",
  description: "List all memberships belonging to an organization. This is a wrapper command that provides help for org membership operations.",
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The membership command to run",
        enum: ["list", "list-own", "revoke"]
      },
      help: {
        type: "boolean",
        description: "Show help for org membership commands",
        default: false
      }
    },
    required: []
  }
};