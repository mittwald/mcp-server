import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlUserListCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/user-list-cli.js';

const tool: Tool = {
  name: 'mittwald_database_mysql_user_list',
  title: 'List MySQL Users',
  description: 'List MySQL users for a database.',
  inputSchema: {
    type: 'object',
    properties: {
      databaseId: {
        type: 'string',
        description: 'ID or short ID of the MySQL database to list users for.'
      },
      outputFormat: {
        type: 'string',
        enum: ['json', 'yaml', 'txt', 'csv', 'tsv'],
        description: 'Preferred CLI output format. JSON enables structured responses.',
        default: 'json'
      },
      extended: {
        type: 'boolean',
        description: 'Include extended columns such as access level.'
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
    required: ['databaseId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseMysqlUserListCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_database_mysql_user_list_cli = tool;
