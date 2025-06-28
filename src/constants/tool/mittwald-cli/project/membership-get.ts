import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_membership_get: Tool = {
  name: "mittwald_project_membership_get",
  description: "Get a ProjectMembership",
  inputSchema: {
    type: "object",
    properties: {
      membershipId: {
        type: "string",
        description: "ID of the ProjectMembership to be retrieved."
      },
      output: {
        type: "string",
        description: "Output format",
        enum: ["txt", "json", "yaml"],
        default: "txt"
      }
    },
    required: ["membershipId"]
  }
};