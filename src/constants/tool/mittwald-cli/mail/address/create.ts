/**
 * @file mittwald_mail_address_create tool definition
 * @module constants/tool/mittwald-cli/mail/address
 */

export const mittwald_mail_address_create = {
  name: 'mittwald_mail_address_create',
  description: 'Create a new mail address',
  inputSchema: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Mail address to create',
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; optional if a default project is set in the context',
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary',
        default: false,
      },
      catchAll: {
        type: 'boolean',
        description: 'Make this a catch-all mail address',
        default: false,
      },
      enableSpamProtection: {
        type: 'boolean',
        description: 'Enable spam protection for this mailbox',
        default: true,
      },
      quota: {
        type: 'string',
        description: 'Mailbox quota (e.g., "1GiB")',
        default: '1GiB',
      },
      password: {
        type: 'string',
        description: 'Mailbox password (mutually exclusive with randomPassword)',
      },
      randomPassword: {
        type: 'boolean',
        description: 'Generate a random password (mutually exclusive with password)',
        default: false,
      },
      forwardTo: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Forward mail to other addresses (exclusive with catch-all, quota, password, randomPassword)',
      },
    },
    required: ['address'],
  },
} as const;