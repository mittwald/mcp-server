import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_charsets: Tool = {
  name: 'mittwald_database_mysql_charsets',
  description: 'List available MySQL character sets and collations, optionally filtered by a MySQLVersion',
  inputSchema: {
    type: 'object',
    properties: {
      output: {
        type: 'string',
        description: 'Output format',
        enum: ['txt', 'json', 'yaml', 'csv', 'tsv'],
        default: 'json',
      },
      extended: {
        type: 'boolean',
        description: 'Show extended information',
      },
      noHeader: {
        type: 'boolean',
        description: 'Hide table header',
      },
      noTruncate: {
        type: 'boolean',
        description: 'Do not truncate output (only relevant for txt output)',
      },
      noRelativeDates: {
        type: 'boolean',
        description: 'Show dates in absolute format, not relative (only relevant for txt output)',
      },
      csvSeparator: {
        type: 'string',
        description: 'Separator for CSV output (only relevant for CSV output)',
        enum: [',', ';'],
        default: ',',
      },
    },
    required: [],
  },
};