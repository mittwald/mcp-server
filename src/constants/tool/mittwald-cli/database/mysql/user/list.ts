import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_user_list: Tool = {
  name: 'mittwald_database_mysql_user_list',
  description: 'List MySQL users belonging to a database',
  inputSchema: {
    type: 'object',
    properties: {
      databaseId: {
        type: 'string',
        description: 'ID of the MySQL database to list users for',
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml', 'csv', 'tsv'],
        description: 'Output format for the user list',
        default: 'json',
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
    required: ['databaseId'],
  },
};