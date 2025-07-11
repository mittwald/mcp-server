/**
 * @file Tool definition for mittwald_mail_address_create_cli
 * @module constants/tool/mittwald-cli/mail/address/create-cli
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleMittwaldMailAddressCreateCli } from '../../../../../handlers/tools/mittwald-cli/mail/address/create-cli.js';

const tool: Tool = {
  name: 'mittwald_mail_address_create',
  description: 'Create a new mail address using Mittwald CLI',
  inputSchema: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Mail address to create'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this flag is optional if a default project is set in the context'
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
        description: 'Mailbox quota (default: 1GiB)'
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
    required: ['address']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleMittwaldMailAddressCreateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_mail_address_create_cli = tool;