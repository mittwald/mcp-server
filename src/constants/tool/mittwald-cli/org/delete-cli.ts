import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_org_delete_cli: Tool = {
  name: "mittwald_org_delete_cli",
  description: "Delete an organization using CLI wrapper",
  inputSchema: {
    type: "object",
    properties: {
      orgId: {
        type: "string",
        description: "ID or short ID of the organization to delete"
      },
      force: {
        type: "boolean",
        description: "Force deletion without interactive confirmation",
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