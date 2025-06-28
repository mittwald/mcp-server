import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_domain_virtualhost_delete: Tool = {
  name: "mittwald_domain_virtualhost_delete",
  description: "Delete a virtual host.",
  inputSchema: {
    type: "object",
    properties: {
      virtualHostId: {
        type: "string",
        description: "ID of the virtual host to delete"
      },
      force: {
        type: "boolean",
        description: "Do not ask for confirmation"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      }
    },
    required: ["virtualHostId"]
  }
};