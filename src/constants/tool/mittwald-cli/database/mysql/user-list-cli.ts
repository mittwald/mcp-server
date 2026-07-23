import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlUserListCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/user-list-cli.js';

const tool: Tool = {
  name: 'mittwald_database_mysql_user_list',
  title: 'List MySQL Users',
  annotations: {
    title: 'List MySQL Users',
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description: 'List MySQL users for a database.',
  inputSchema: {
    type: 'object',
    properties: {
      databaseId: {
        type: 'string',
        description: 'ID of the MySQL database to list users for'
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
