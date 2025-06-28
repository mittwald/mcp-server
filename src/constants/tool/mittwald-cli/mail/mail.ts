import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_mail: Tool = {
  name: "mittwald_mail",
  description: "Manage mailboxes and mail addresses in your projects. Use topics: address, deliverybox",
  inputSchema: {
    type: "object",
    properties: {
      help: {
        type: "boolean",
        description: "Show help for mail commands",
        default: false
      }
    },
    required: []
  }
};