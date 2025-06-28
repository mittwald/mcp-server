import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldMailAddressUpdate: Tool = {
  name: "mittwald_mail_address_update",
  description: "Update a mail address in a project. Can update password, quota, forwarding addresses, or catch-all status.",
  inputSchema: {
    type: "object",
    properties: {
      mailaddressId: {
        type: "string",
        description: "ID or mail address of a mailaddress"
      },
      address: {
        type: "string",
        description: "Mail address (optional)"
      },
      catchAll: {
        type: "boolean",
        description: "Change this from or to a catch-all mail address (optional)"
      },
      quota: {
        type: "number",
        description: "Mailbox quota in mebibytes (optional)"
      },
      password: {
        type: "string",
        description: "Mailbox password (optional)"
      },
      randomPassword: {
        type: "boolean",
        description: "Generate a random password (optional)"
      },
      forwardTo: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Forward mail to other addresses (optional)"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      }
    },
    required: ["mailaddressId"]
  }
};