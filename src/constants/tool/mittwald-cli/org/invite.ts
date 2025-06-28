import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_org_invite: Tool = {
  name: "mittwald_org_invite",
  description: "Invite a user to an organization",
  inputSchema: {
    type: "object",
    properties: {
      orgId: {
        type: "string",
        description: "ID or short ID of an org; this argument is optional if a default org is set in the context"
      },
      email: {
        type: "string",
        description: "Email address of the user to invite"
      },
      role: {
        type: "string",
        description: "Role to assign to the invited user",
        enum: ["owner", "member"],
        default: "member"
      },
      message: {
        type: "string",
        description: "Optional message to include with the invitation"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
        default: false
      }
    },
    required: ["email"]
  }
};