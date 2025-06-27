import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mail_list_mail_addresses: Tool = {
  name: "mail_list_mail_addresses",
  description: "List all mail addresses for a project",
  inputSchema: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to list mail addresses for",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 50,
        description: "Maximum number of results to return",
      },
      skip: {
        type: "integer",
        minimum: 0,
        default: 0,
        description: "Number of results to skip for pagination",
      },
    },
  },
  _meta: {
    title: "List Mail Addresses",
    hidden: false,
    type: "server",
  },
};

export const mail_create_mail_address: Tool = {
  name: "mail_create_mail_address",
  description: "Create a new mail address for a project",
  inputSchema: {
    type: "object",
    required: ["projectId", "address"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to create the mail address in",
      },
      address: {
        type: "string",
        description: "The email address to create (e.g., info@example.com)",
      },
      isCatchAll: {
        type: "boolean",
        default: false,
        description: "Whether this address should catch all emails for unmatched addresses",
      },
      mailbox: {
        type: "object",
        description: "Mailbox configuration",
        properties: {
          enabled: {
            type: "boolean",
            description: "Whether the mailbox is enabled",
          },
          password: {
            type: "string",
            description: "Password for the mailbox",
          },
          quotaInBytes: {
            type: "integer",
            description: "Mailbox quota in bytes",
          },
        },
      },
      forwardAddresses: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Email addresses to forward to",
      },
      autoResponder: {
        type: "object",
        description: "Auto-responder configuration",
        properties: {
          enabled: {
            type: "boolean",
            description: "Whether auto-responder is enabled",
          },
          subject: {
            type: "string",
            description: "Auto-responder subject",
          },
          message: {
            type: "string",
            description: "Auto-responder message",
          },
        },
      },
      spamProtection: {
        type: "object",
        description: "Spam protection configuration",
        properties: {
          enabled: {
            type: "boolean",
            description: "Whether spam protection is enabled",
          },
          folder: {
            type: "string",
            description: "Folder to move spam to",
          },
        },
      },
    },
  },
  _meta: {
    title: "Create Mail Address",
    hidden: false,
    type: "server",
  },
};

export const mail_get_mail_address: Tool = {
  name: "mail_get_mail_address",
  description: "Get details of a specific mail address",
  inputSchema: {
    type: "object",
    required: ["mailAddressId"],
    properties: {
      mailAddressId: {
        type: "string",
        description: "The mail address ID",
      },
    },
  },
  _meta: {
    title: "Get Mail Address",
    hidden: false,
    type: "server",
  },
};

export const mail_delete_mail_address: Tool = {
  name: "mail_delete_mail_address",
  description: "Delete a mail address",
  inputSchema: {
    type: "object",
    required: ["mailAddressId"],
    properties: {
      mailAddressId: {
        type: "string",
        description: "The mail address ID to delete",
      },
    },
  },
  _meta: {
    title: "Delete Mail Address",
    hidden: false,
    type: "server",
  },
};

export const mail_update_mail_address_address: Tool = {
  name: "mail_update_mail_address_address",
  description: "Update the email address of a mail address",
  inputSchema: {
    type: "object",
    required: ["mailAddressId", "address"],
    properties: {
      mailAddressId: {
        type: "string",
        description: "The mail address ID to update",
      },
      address: {
        type: "string",
        description: "The new email address",
      },
    },
  },
  _meta: {
    title: "Update Mail Address",
    hidden: false,
    type: "server",
  },
};

export const mail_update_mail_address_password: Tool = {
  name: "mail_update_mail_address_password",
  description: "Update the password of a mail address mailbox",
  inputSchema: {
    type: "object",
    required: ["mailAddressId", "password"],
    properties: {
      mailAddressId: {
        type: "string",
        description: "The mail address ID to update",
      },
      password: {
        type: "string",
        description: "The new password",
      },
    },
  },
  _meta: {
    title: "Update Mail Address Password",
    hidden: false,
    type: "server",
  },
};

export const mail_update_mail_address_quota: Tool = {
  name: "mail_update_mail_address_quota",
  description: "Update the mailbox quota of a mail address",
  inputSchema: {
    type: "object",
    required: ["mailAddressId", "quotaInBytes"],
    properties: {
      mailAddressId: {
        type: "string",
        description: "The mail address ID to update",
      },
      quotaInBytes: {
        type: "integer",
        minimum: 0,
        description: "The new quota in bytes",
      },
    },
  },
  _meta: {
    title: "Update Mail Address Quota",
    hidden: false,
    type: "server",
  },
};

export const mail_update_mail_address_forward_addresses: Tool = {
  name: "mail_update_mail_address_forward_addresses",
  description: "Update the forward addresses of a mail address",
  inputSchema: {
    type: "object",
    required: ["mailAddressId", "forwardAddresses"],
    properties: {
      mailAddressId: {
        type: "string",
        description: "The mail address ID to update",
      },
      forwardAddresses: {
        type: "array",
        items: {
          type: "string",
        },
        description: "The email addresses to forward to",
      },
    },
  },
  _meta: {
    title: "Update Mail Address Forward Addresses",
    hidden: false,
    type: "server",
  },
};

export const mail_update_mail_address_autoresponder: Tool = {
  name: "mail_update_mail_address_autoresponder",
  description: "Update the auto-responder settings of a mail address",
  inputSchema: {
    type: "object",
    required: ["mailAddressId", "enabled"],
    properties: {
      mailAddressId: {
        type: "string",
        description: "The mail address ID to update",
      },
      enabled: {
        type: "boolean",
        description: "Whether the auto-responder is enabled",
      },
      subject: {
        type: "string",
        description: "Auto-responder subject (required if enabled)",
      },
      message: {
        type: "string",
        description: "Auto-responder message (required if enabled)",
      },
    },
  },
  _meta: {
    title: "Update Mail Address Auto-responder",
    hidden: false,
    type: "server",
  },
};

export const mail_update_mail_address_spam_protection: Tool = {
  name: "mail_update_mail_address_spam_protection",
  description: "Update the spam protection settings of a mail address",
  inputSchema: {
    type: "object",
    required: ["mailAddressId", "enabled"],
    properties: {
      mailAddressId: {
        type: "string",
        description: "The mail address ID to update",
      },
      enabled: {
        type: "boolean",
        description: "Whether spam protection is enabled",
      },
      folder: {
        type: "string",
        default: "Spam",
        description: "Folder to move spam to (default: Spam)",
      },
    },
  },
  _meta: {
    title: "Update Mail Address Spam Protection",
    hidden: false,
    type: "server",
  },
};

export const mail_update_mail_address_catch_all: Tool = {
  name: "mail_update_mail_address_catch_all",
  description: "Update whether a mail address is a catch-all address",
  inputSchema: {
    type: "object",
    required: ["mailAddressId", "isCatchAll"],
    properties: {
      mailAddressId: {
        type: "string",
        description: "The mail address ID to update",
      },
      isCatchAll: {
        type: "boolean",
        description: "Whether this address should catch all emails for unmatched addresses",
      },
    },
  },
  _meta: {
    title: "Update Mail Address Catch-All",
    hidden: false,
    type: "server",
  },
};

// Success messages for handlers
export const mailAddressesSuccessMessages = {
  list: "Successfully retrieved mail addresses",
  create: "Successfully created mail address",
  get: "Successfully retrieved mail address details",
  delete: "Successfully deleted mail address",
  updateAddress: "Successfully updated mail address",
  updatePassword: "Successfully updated mail address password",
  updateQuota: "Successfully updated mail address quota",
  updateForwardAddresses: "Successfully updated forward addresses",
  updateAutoresponder: "Successfully updated auto-responder settings",
  updateSpamProtection: "Successfully updated spam protection settings",
  updateCatchAll: "Successfully updated catch-all setting",
};