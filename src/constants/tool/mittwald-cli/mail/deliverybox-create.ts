import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldMailDeliveryboxCreate: Tool = {
  name: "mittwald_mail_deliverybox_create",
  description: "Create a new mail delivery box in a project.",
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "Mail delivery box description (required)"
      },
      projectId: {
        type: "string",
        description: "ID or short ID of a project (optional if default project is set)"
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
    required: ["description"]
  }
};