import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_dependency_versions: Tool = {
  name: 'mittwald_app_dependency_versions',
  description: 'Get all available versions of a particular dependency',
  inputSchema: {
    type: 'object',
    properties: {
      systemsoftware: {
        type: 'string',
        description: 'Name of the systemsoftware for which to list versions',
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
    required: ['systemsoftware'],
  },
};