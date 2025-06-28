/**
 * @file mittwald_mail_address_delete tool definition
 * @module constants/tool/mittwald-cli/mail/address
 */

export const mittwald_mail_address_delete = {
  name: 'mittwald_mail_address_delete',
  description: 'Delete a mail address',
  inputSchema: {
    type: 'object',
    properties: {
      mailAddressId: {
        type: 'string',
        description: 'Mail address ID to delete',
      },
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation (required in MCP context)',
        default: true,
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary',
        default: false,
      },
    },
    required: ['mailAddressId', 'force'],
  },
} as const;