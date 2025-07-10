import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_org_invite_revoke_cli: Tool = {
  name: "mittwald_org_invite_revoke_cli",
  description: "Revoke an invite to an organization using CLI wrapper",
  inputSchema: {
    type: "object",
    properties: {
      inviteId: {
        type: "string",
        description: "The ID of the invite to revoke"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
        default: false
      }
    },
    required: ["inviteId"]
  }
};