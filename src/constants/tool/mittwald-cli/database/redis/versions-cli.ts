import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseRedisVersionsCli } from '../../../../../handlers/tools/mittwald-cli/database/redis/versions-cli.js';

const tool: Tool = {
  name: 'mittwald_database_redis_versions',
  title: 'List Redis Versions',
  description: 'List available Redis versions.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to filter available versions (different projects may have different versions available)'
      }
    },
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseRedisVersionsCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_database_redis_versions_cli = tool;
