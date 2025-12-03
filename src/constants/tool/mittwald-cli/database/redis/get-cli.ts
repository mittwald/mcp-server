import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseRedisGetCli } from '../../../../../handlers/tools/mittwald-cli/database/redis/get-cli.js';

const tool: Tool = {
  name: 'mittwald_database_redis_get',
  title: 'Get Redis Database',
  description: 'Retrieve details for a Redis database.',
  inputSchema: {
    type: 'object',
    properties: {
      redisId: {
        type: 'string',
        description: 'ID or short ID of the Redis database to retrieve.'
      },
      outputFormat: {
        type: 'string',
        enum: ['json', 'yaml', 'txt'],
        description: 'Preferred CLI output format. JSON enables structured responses.'
      }
    },
    required: ['redisId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseRedisGetCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_database_redis_get_cli = tool;
