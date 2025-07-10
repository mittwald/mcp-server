/**
 * @file Tool definition for mittwald_mail_deliverybox_get_cli
 * @module constants/tool/mittwald-cli/mail/deliverybox/get-cli
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_mail_deliverybox_get_cli: Tool = {
  name: 'mittwald_mail_deliverybox_get_cli',
  description: 'Get a specific delivery box using Mittwald CLI',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID of the delivery box to retrieve'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        default: 'txt',
        description: 'Output format'
      }
    },
    required: ['id']
  }
};