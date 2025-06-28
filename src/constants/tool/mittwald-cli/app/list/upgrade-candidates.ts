import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_list_upgrade_candidates: Tool = {
  name: 'mittwald_app_list_upgrade_candidates',
  description: 'List upgrade candidates for an app installation',
  inputSchema: {
    type: 'object',
    properties: {
      installation_id: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context',
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml', 'csv', 'tsv'],
        description: 'Output in a more machine friendly format',
        default: 'txt',
      },
      extended: {
        type: 'boolean',
        description: 'Show extended information',
        default: false,
      },
      no_header: {
        type: 'boolean',
        description: 'Hide table header',
        default: false,
      },
      no_truncate: {
        type: 'boolean',
        description: 'Do not truncate output (only relevant for txt output)',
        default: false,
      },
      no_relative_dates: {
        type: 'boolean',
        description: 'Show dates in absolute format, not relative (only relevant for txt output)',
        default: false,
      },
      csv_separator: {
        type: 'string',
        enum: [',', ';'],
        description: 'Separator for CSV output (only relevant for CSV output)',
        default: ',',
      },
    },
    required: [],
  },
};