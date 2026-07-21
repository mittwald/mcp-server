import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseRedisListCli } from '../../../../../handlers/tools/mittwald-cli/database/redis/list-cli.js';

const tool: Tool = {
  name: 'mittwald_database_redis_list',
  title: 'List Redis Databases',
  description: 'List Redis databases for a project.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to list Redis databases for'
      }
    },
    required: ['projectId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseRedisListCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_database_redis_list_cli = tool;
