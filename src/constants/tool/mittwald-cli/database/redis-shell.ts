/**
 * @file Redis database shell tool definition
 * @module constants/tool/mittwald-cli/database/redis-shell
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_redis_shell: Tool = {
  name: 'mittwald_database_redis_shell',
  description: 'Connect to a Redis database via the redis-cli',
  inputSchema: {
    type: 'object',
    properties: {
      databaseId: {
        type: 'string',
        description: 'The ID of the database (when a project context is set, you can also use the name)',
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary',
        default: false,
      },
      sshUser: {
        type: 'string',
        description: 'Override the SSH user to connect with',
      },
      sshIdentityFile: {
        type: 'string',
        description: 'The SSH identity file (private key) to use for public key authentication',
      },
    },
    required: ['databaseId'],
  },
};