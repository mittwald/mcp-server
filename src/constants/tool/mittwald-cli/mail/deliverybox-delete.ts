import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldMailDeliveryboxDelete: Tool = {
  name: "mittwald_mail_deliverybox_delete",
  description: "Delete a mail delivery box.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Mail delivery box ID"
      },
      force: {
        type: "boolean",
        description: "Do not ask for confirmation (required in MCP context)"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      }
    },
    required: ["id", "force"]
  }
};