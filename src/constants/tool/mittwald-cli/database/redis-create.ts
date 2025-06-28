/**
 * @file Redis database create tool definition
 * @module constants/tool/mittwald-cli/database/redis-create
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_redis_create: Tool = {
  name: 'mittwald_database_redis_create',
  description: 'Create a new Redis database',
  inputSchema: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'A description for the database',
      },
      version: {
        type: 'string',
        description: 'The Redis version to use. Use the "database redis versions" command to list available versions',
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project',
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary',
        default: false,
      },
      persistent: {
        type: 'boolean',
        description: 'Enable persistent storage for the Redis database',
        default: false,
      },
      maxMemory: {
        type: 'string',
        description: 'The maximum memory for the Redis database (e.g., "1Gi", "512Mi")',
      },
      maxMemoryPolicy: {
        type: 'string',
        description: 'The Redis eviction policy',
        enum: [
          'noeviction',
          'allkeys-lru',
          'allkeys-lfu',
          'volatile-lru',
          'volatile-lfu',
          'allkeys-random',
          'volatile-random',
          'volatile-ttl'
        ],
      },
    },
    required: ['description', 'version'],
  },
};