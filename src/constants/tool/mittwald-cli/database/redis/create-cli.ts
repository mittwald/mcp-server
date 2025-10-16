import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseRedisCreateCli } from '../../../../../handlers/tools/mittwald-cli/database/redis/create-cli.js';

const tool: Tool = {
  name: 'mittwald_database_redis_create',
  title: 'Create Redis Database',
  description: 'Provision a new Redis database within a project.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID or short ID for the Redis database (format: p-XXXXX).'
      },
      description: {
        type: 'string',
        description: 'Human-readable description for the Redis database.'
      },
      version: {
        type: 'string',
        description: 'Redis version to deploy (see redis versions tool for options).'
      },
      persistent: {
        type: 'boolean',
        description: 'Enable persistent storage. Defaults to true.',
        default: true
      },
      maxMemory: {
        type: 'string',
        description: 'Maximum memory size (e.g., 512Mi, 1Gi).'
      },
      maxMemoryPolicy: {
        type: 'string',
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
        description: 'Redis eviction policy applied when memory limit is reached.'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress CLI output for machine-friendly responses.',
        default: true
      }
    },
    required: ['projectId', 'description', 'version']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseRedisCreateCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_database_redis_create_cli = tool;
