/**
 * @file Tool definition for mittwald_mail_address_update_cli
 * @module constants/tool/mittwald-cli/mail/address/update-cli
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_mail_address_update_cli: Tool = {
  name: 'mittwald_mail_address_update_cli',
  description: 'Update a mail address using Mittwald CLI',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID of the mail address to update'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      catchAll: {
        type: 'boolean',
        description: 'Make this a catch-all mail address'
      },
      enableSpamProtection: {
        type: 'boolean',
        description: 'Enable spam protection for this mailbox'
      },
      quota: {
        type: 'string',
        description: 'Mailbox quota'
      },
      password: {
        type: 'string',
        description: 'Mailbox password (CAUTION: providing this flag may log your password in shell history)'
      },
      randomPassword: {
        type: 'boolean',
        description: 'Generate a random password'
      },
      forwardTo: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Forward mail to other addresses'
      }
    },
    required: ['id']
  }
};