import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_membership_get_own: Tool = {
  name: "mittwald_project_membership_get_own",
  description: "Get the executing user's membership in a Project.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      },
      output: {
        type: "string",
        description: "Output format",
        enum: ["txt", "json", "yaml"],
        default: "txt"
      }
    },
    required: []
  }
};