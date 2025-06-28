import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_create: Tool = {
  name: 'mittwald_database_mysql_create',
  description: 'Create a new MySQL database',
  inputSchema: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'A description for the database',
      },
      version: {
        type: 'string',
        description: 'The MySQL version to use',
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this flag is optional if a default project is set in the context',
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary',
      },
      collation: {
        type: 'string',
        description: 'The collation to use',
        default: 'utf8mb4_unicode_ci',
      },
      characterSet: {
        type: 'string',
        description: 'The character set to use',
        default: 'utf8mb4',
      },
      userPassword: {
        type: 'string',
        description: 'The password to use for the default user',
      },
      userExternal: {
        type: 'boolean',
        description: 'Enable external access for default user',
      },
      userAccessLevel: {
        type: 'string',
        description: 'The access level preset for the default user',
        enum: ['full', 'readonly'],
        default: 'full',
      },
    },
    required: ['description', 'version'],
  },
};