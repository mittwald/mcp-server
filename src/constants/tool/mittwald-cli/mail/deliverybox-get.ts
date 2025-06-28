import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldMailDeliveryboxGet: Tool = {
  name: "mittwald_mail_deliverybox_get",
  description: "Get a specific delivery box.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the delivery box you want to retrieve"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        description: "Output format (default: txt)"
      }
    },
    required: ["id", "output"]
  }
};