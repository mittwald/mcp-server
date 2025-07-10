import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_stack_ps_cli: Tool = {
  name: 'mittwald_container_stack_ps_cli',
  description: 'List all services within a given container stack using CLI wrapper',
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'ID of a stack'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml', 'csv', 'tsv'],
        description: 'Output format'
      },
      extended: {
        type: 'boolean',
        description: 'Show extended information'
      },
      noHeader: {
        type: 'boolean',
        description: 'Hide table header'
      },
      noTruncate: {
        type: 'boolean',
        description: 'Do not truncate output'
      },
      noRelativeDates: {
        type: 'boolean',
        description: 'Show dates in absolute format'
      },
      csvSeparator: {
        type: 'string',
        enum: [',', ';'],
        description: 'Separator for CSV output'
      }
    },
    required: []
  }
};