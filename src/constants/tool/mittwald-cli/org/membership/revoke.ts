import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_org_membership_revoke: Tool = {
  name: "mittwald_org_membership_revoke",
  description: "Revoke a user's membership to an organization.",
  inputSchema: {
    type: "object",
    properties: {
      membershipId: {
        type: "string",
        description: "The ID of the membership to revoke"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
        default: false
      }
    },
    required: ["membershipId"]
  }
};