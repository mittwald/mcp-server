/**
 * @file Tool definition for mittwald_mail_address_delete_cli
 * @module constants/tool/mittwald-cli/mail/address/delete-cli
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_mail_address_delete_cli: Tool = {
  name: 'mittwald_mail_address_delete_cli',
  description: 'Delete a mail address using Mittwald CLI',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID of the mail address to delete'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation'
      }
    },
    required: ['id']
  }
};