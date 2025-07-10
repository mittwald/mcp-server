/**
 * @file Tool definition for mittwald_mail_deliverybox_create_cli
 * @module constants/tool/mittwald-cli/mail/deliverybox/create-cli
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_mail_deliverybox_create_cli: Tool = {
  name: 'mittwald_mail_deliverybox_create_cli',
  description: 'Create a new delivery box using Mittwald CLI',
  inputSchema: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'Description for the delivery box'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this flag is optional if a default project is set in the context'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      password: {
        type: 'string',
        description: 'Delivery box password (CAUTION: providing this flag may log your password in shell history)'
      },
      randomPassword: {
        type: 'boolean',
        description: 'Generate a random password'
      }
    },
    required: ['description']
  }
};