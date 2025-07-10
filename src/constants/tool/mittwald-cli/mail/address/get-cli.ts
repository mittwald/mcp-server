/**
 * @file Tool definition for mittwald_mail_address_get_cli
 * @module constants/tool/mittwald-cli/mail/address/get-cli
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_mail_address_get_cli: Tool = {
  name: 'mittwald_mail_address_get_cli',
  description: 'Get a specific mail address using Mittwald CLI',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID of the mail address to retrieve'
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