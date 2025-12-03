import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlUserGetCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/user-get-cli.js';

const tool: Tool = {
  name: 'mittwald_database_mysql_user_get',
  title: 'Get MySQL User',
  description: 'Retrieve details for a specific MySQL user.',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'ID or short ID of the MySQL user to retrieve.'
      },
      outputFormat: {
        type: 'string',
        enum: ['json', 'yaml', 'txt'],
        description: 'Preferred CLI output format. JSON enables structured responses.'
      }
    },
    required: ['userId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseMysqlUserGetCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_database_mysql_user_get_cli = tool;
