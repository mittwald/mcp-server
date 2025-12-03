import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlUserCreateCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/user-create-cli.js';

const tool: Tool = {
  name: 'mittwald_database_mysql_user_create',
  title: 'Create MySQL User',
  description: 'Create a new MySQL user for a database.',
  inputSchema: {
    type: 'object',
    properties: {
      databaseId: {
        type: 'string',
        description: 'ID or short ID of the MySQL database (format: mysql-XXXXX).'
      },
      description: {
        type: 'string',
        description: 'Friendly description shown in mStudio (defaults to username when provided).'
      },
      username: {
        type: 'string',
        description: 'Optional alias for description when creating the MySQL user.'
      },
      accessLevel: {
        type: 'string',
        enum: ['readonly', 'full'],
        description: 'Access permissions for the MySQL user (defaults to full).'
      },
      password: {
        type: 'string',
        description: 'Password for the MySQL user. A secure password is generated when omitted.'
      },
      enableExternalAccess: {
        type: 'boolean',
        description: 'Enable external access for this MySQL user.'
      },
      accessIpMask: {
        type: 'string',
        description: 'Restrict external access to a specific IPv4/IPv6 address or CIDR mask.'
      },
      quiet: {
        type: 'boolean',
        description: 'Request quiet CLI output (recommended for machine-readable responses).'
      }
    },
    required: ['databaseId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseMysqlUserCreateCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_database_mysql_user_create_cli = tool;
