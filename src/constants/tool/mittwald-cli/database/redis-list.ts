/**
 * @file Redis database list tool definition
 * @module constants/tool/mittwald-cli/database/redis-list
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_redis_list: Tool = {
  name: 'mittwald_database_redis_list',
  description: 'List Redis databases belonging to a project',
  inputSchema: {
    type: 'object',
    properties: {
      output: {
        type: 'string',
        description: 'Output format',
        enum: ['txt', 'json', 'yaml', 'csv', 'tsv'],
        default: 'txt',
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project',
      },
      extended: {
        type: 'boolean',
        description: 'Show extended information',
        default: false,
      },
      csvSeparator: {
        type: 'string',
        description: 'Separator for CSV output',
        enum: [',', ';'],
        default: ',',
      },
      noHeader: {
        type: 'boolean',
        description: 'Hide table header',
        default: false,
      },
      noRelativeDates: {
        type: 'boolean',
        description: 'Show dates in absolute format, not relative',
        default: false,
      },
      noTruncate: {
        type: 'boolean',
        description: 'Do not truncate output',
        default: false,
      },
    },
    required: [],
  },
};