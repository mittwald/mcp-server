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
        description: 'Project ID or short ID used to filter Redis databases.'
      },
      outputFormat: {
        type: 'string',
        enum: ['json', 'yaml', 'txt', 'csv', 'tsv'],
        description: 'Preferred CLI output format. JSON enables structured responses.'
      },
      extended: {
        type: 'boolean',
        description: 'Include extended columns such as status and hostname.'
      },
      noHeader: {
        type: 'boolean',
        description: 'Hide table headers for text and CSV output.'
      },
      noTruncate: {
        type: 'boolean',
        description: 'Disable truncation for wide text output.'
      },
      noRelativeDates: {
        type: 'boolean',
        description: 'Show absolute timestamps instead of relative strings.'
      },
      csvSeparator: {
        type: 'string',
        enum: [',', ';'],
        description: 'Custom separator for CSV output.'
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
