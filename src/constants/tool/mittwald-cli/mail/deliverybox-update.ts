import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldMailDeliveryboxUpdate: Tool = {
  name: "mittwald_mail_deliverybox_update",
  description: "Update a mail delivery box.",
  inputSchema: {
    type: "object",
    properties: {
      maildeliveryboxId: {
        type: "string",
        description: "ID or short ID of a maildeliverybox"
      },
      description: {
        type: "string",
        description: "Delivery box description (optional)"
      },
      password: {
        type: "string",
        description: "Delivery box password (optional)"
      },
      randomPassword: {
        type: "boolean",
        description: "Generate a random password (optional)"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      }
    },
    required: ["maildeliveryboxId"]
  }
};