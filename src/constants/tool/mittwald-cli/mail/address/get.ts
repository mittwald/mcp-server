/**
 * @file mittwald_mail_address_get tool definition
 * @module constants/tool/mittwald-cli/mail/address
 */

export const mittwald_mail_address_get = {
  name: 'mittwald_mail_address_get',
  description: 'Get a specific mail address',
  inputSchema: {
    type: 'object',
    properties: {
      mailAddressId: {
        type: 'string',
        description: 'ID of the address you want to get',
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format',
        default: 'txt',
      },
    },
    required: ['mailAddressId', 'output'],
  },
} as const;