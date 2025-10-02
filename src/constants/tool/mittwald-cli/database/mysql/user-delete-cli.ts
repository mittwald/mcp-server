import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlUserDeleteCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/user-delete-cli.js';

const tool: Tool = {
  name: 'mittwald_database_mysql_user_delete',
  title: 'Delete MySQL User',
  description: 'Delete an existing MySQL user.',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'ID or short ID of the MySQL user to delete (format: mysql-user-XXXXX).'
      },
      force: {
        type: 'boolean',
        description: 'Skip confirmation prompts when deleting the user.'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress CLI output for machine-friendly responses.',
        default: true
      }
    },
    required: ['userId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseMysqlUserDeleteCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_database_mysql_user_delete_cli = tool;
