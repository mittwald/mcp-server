import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_user_delete: Tool = {
  name: 'mittwald_database_mysql_user_delete',
  description: 'Delete a MySQL user',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'ID of the MySQL user to delete',
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary',
        default: false,
      },
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation',
        default: false,
      },
    },
    required: ['userId'],
  },
};