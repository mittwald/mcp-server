import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_org_get: Tool = {
  name: "mittwald_org_get",
  description: "Get an organization profile",
  inputSchema: {
    type: "object",
    properties: {
      orgId: {
        type: "string",
        description: "ID or short ID of an org; this argument is optional if a default org is set in the context"
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