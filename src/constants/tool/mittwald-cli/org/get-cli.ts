import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_org_get_cli: Tool = {
  name: "mittwald_org_get_cli",
  description: "Get an organization profile using CLI wrapper",
  inputSchema: {
    type: "object",
    properties: {
      orgId: {
        type: "string",
        description: "ID or short ID of an org; this parameter is optional if a default org is set in the context"
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