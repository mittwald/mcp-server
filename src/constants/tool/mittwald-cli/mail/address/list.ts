/**
 * @file mittwald_mail_address_list tool definition
 * @module constants/tool/mittwald-cli/mail/address
 */

export const mittwald_mail_address_list = {
  name: 'mittwald_mail_address_list',
  description: 'Get all mail addresses for a project ID',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; optional if a default project is set in the context',
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml', 'csv', 'tsv'],
        description: 'Output format',
        default: 'txt',
      },
      extended: {
        type: 'boolean',
        description: 'Show extended information',
        default: false,
      },
      noHeader: {
        type: 'boolean',
        description: 'Hide table header',
        default: false,
      },
      noTruncate: {
        type: 'boolean',
        description: 'Do not truncate output (only relevant for txt output)',
        default: false,
      },
      noRelativeDates: {
        type: 'boolean',
        description: 'Show dates in absolute format, not relative (only relevant for txt output)',
        default: false,
      },
      csvSeparator: {
        type: 'string',
        enum: [',', ';'],
        description: 'Separator for CSV output (only relevant for CSV output)',
        default: ',',
      },
    },
    required: ['output'],
  },
} as const;