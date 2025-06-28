import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_org_delete: Tool = {
  name: "mittwald_org_delete",
  description: "Delete an organization",
  inputSchema: {
    type: "object",
    properties: {
      orgId: {
        type: "string",
        description: "ID or short ID of an org; this argument is optional if a default org is set in the context"
      },
      force: {
        type: "boolean",
        description: "Do not ask for confirmation",
        default: false
      },
      quiet: {
        type: "boolean", 
        description: "Suppress process output and only display a machine-readable summary",
        default: false
      }
    },
    required: []
  }
};