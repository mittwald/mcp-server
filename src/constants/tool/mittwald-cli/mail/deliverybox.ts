import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_mail_deliverybox: Tool = {
  name: "mittwald_mail_deliverybox",
  description: "Manage mail delivery boxes. Use subcommands: create, delete, get, list, update",
  inputSchema: {
    type: "object",
    properties: {
      help: {
        type: "boolean",
        description: "Show help for mail deliverybox commands",
        default: false
      }
    },
    required: []
  }
};