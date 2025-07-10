import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_user_get: Tool = {
  name: 'mittwald_database_mysql_user_get',
  description: 'Get a MySQL user',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'ID of the MySQL user to be retrieved',
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format for the user details',
        default: 'json',
      },
    },
    required: ['userId'],
  },
};