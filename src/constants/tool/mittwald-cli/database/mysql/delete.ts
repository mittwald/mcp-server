import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldDatabaseMysqlDelete: Tool = {
  name: 'mittwald_database_mysql_delete',
  description: 'Delete a MySQL database',
  inputSchema: {
    type: 'object',
    properties: {
      databaseId: {
        type: 'string',
        description: 'ID or name of the database to delete',
      },
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation',
        default: true,
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary',
      },
    },
    required: ['databaseId'],
  },
};