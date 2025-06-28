import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldDatabaseList: Tool = {
  name: 'mittwald_database_list',
  description: 'List all kinds of databases belonging to a project',
  input_schema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this flag is optional if a default project is set in the context',
      },
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