/**
 * @file Redis database get tool definition
 * @module constants/tool/mittwald-cli/database/redis-get
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_redis_get: Tool = {
  name: 'mittwald_database_redis_get',
  description: 'Get a Redis database',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID of the Redis database to retrieve',
      },
      output: {
        type: 'string',
        description: 'Output format',
        enum: ['txt', 'json', 'yaml'],
        default: 'txt',
      },
    },
    required: ['id'],
  },
};