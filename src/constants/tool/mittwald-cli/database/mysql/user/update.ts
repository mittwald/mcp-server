import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_user_update: Tool = {
  name: 'mittwald_database_mysql_user_update',
  description: 'Update an existing MySQL user',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'ID of the MySQL user to update',
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary',
        default: false,
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
      accessIpMask: {
        type: 'string',
        description: 'IP to restrict external access to. If specified as IPv4, external access will be restricted to only the specified IP addresses when external access is enabled',
      },
      enableExternalAccess: {
        type: 'boolean',
        description: 'Enable external access for this MySQL user',
        default: false,
      },
      disableExternalAccess: {
        type: 'boolean',
        description: 'Disable external access for this MySQL user',
        default: false,
      },
    },
    required: ['userId'],
  },
};