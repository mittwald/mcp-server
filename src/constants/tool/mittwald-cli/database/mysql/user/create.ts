import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_user_create: Tool = {
  name: 'mittwald_database_mysql_user_create',
  description: 'Create a new MySQL user for a database',
  inputSchema: {
    type: 'object',
    properties: {
      databaseId: {
        type: 'string',
        description: 'MySQL database ID to create a user for (can be UUID or shortId)',
      },
      accessLevel: {
        type: 'string',
        enum: ['readonly', 'full'],
        description: 'Set the access level permissions for the MySQL user',
      },
      description: {
        type: 'string',
        description: 'Set the description for the MySQL user to be displayed in mStudio and with the list command',
      },
      password: {
        type: 'string',
        description: 'Password used for authentication when connecting to the database with this user',
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary',
        default: false,
      },
      accessIpMask: {
        type: 'string',
        description: 'IP to restrict external access to. If specified as IPv4, external access will be restricted to only the specified IP addresses when external access is enabled',
      },
      enableExternalAccess: {
        type: 'boolean',
        description: 'Enable external access for this MySQL user. By default, external access is disabled for newly created MySQL users',
        default: false,
      },
    },
    required: ['databaseId', 'accessLevel', 'description', 'password'],
  },
};