import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlUserUpdateCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/user-update-cli.js';

const tool: Tool = {
  name: 'mittwald_database_mysql_user_update',
  title: 'Update MySQL User',
  description: 'Update properties of an existing MySQL user.',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'ID or short ID of the MySQL user to update.'
      },
      description: {
        type: 'string',
        description: 'New description displayed in mStudio.'
      },
      accessLevel: {
        type: 'string',
        enum: ['readonly', 'full'],
        description: 'Adjust access permissions for the MySQL user.'
      },
      password: {
        type: 'string',
        description: 'Set a new password for the MySQL user.'
      },
      accessIpMask: {
        type: 'string',
        description: 'Restrict external access to a specific IP or CIDR mask.'
      },
      enableExternalAccess: {
        type: 'boolean',
        description: 'Enable external access for this user.'
      },
      disableExternalAccess: {
        type: 'boolean',
        description: 'Disable external access for this user.'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress CLI output for machine-friendly responses.'
      }
    },
    required: ['userId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseMysqlUserUpdateCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_database_mysql_user_update_cli = tool;
