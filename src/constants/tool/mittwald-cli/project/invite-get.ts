import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_invite_get: Tool = {
  name: "mittwald_project_invite_get",
  description: "Get a ProjectInvite.",
  inputSchema: {
    type: "object",
    properties: {
      inviteId: {
        type: "string",
        description: "ID of the ProjectInvite to be retrieved."
      },
      output: {
        type: "string",
        description: "Output format",
        enum: ["json", "table", "yaml"]
      }
    },
    required: ["inviteId"]
  }
};