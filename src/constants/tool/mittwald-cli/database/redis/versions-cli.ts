import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseRedisVersionsCli } from '../../../../../handlers/tools/mittwald-cli/database/redis/versions-cli.js';

const tool: Tool = {
  name: 'mittwald_database_redis_versions',
  title: 'List Redis Versions',
  description: 'List available Redis versions for deployment.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Optional project context used to filter available versions.'
      },
      outputFormat: {
        type: 'string',
        enum: ['json', 'yaml', 'txt', 'csv', 'tsv'],
        description: 'Preferred CLI output format. JSON enables structured responses.',
        default: 'json'
      },
      extended: {
        type: 'boolean',
        description: 'Include additional metadata about each version.'
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
    }
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseRedisVersionsCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_database_redis_versions_cli = tool;
