import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_sftp_user_create: Tool = {
  name: 'mittwald_sftp_user_create',
  description: 'Create a new SFTP user with specified directories and access permissions.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this flag is optional if a default project is set in the context'
      },
      description: {
        type: 'string',
        description: 'Set description for SFTP user'
      },
      directories: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Specify directories to restrict this SFTP users access to'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      expires: {
        type: 'string',
        description: 'An interval after which the SFTP User expires (examples: 30m, 30d, 1y)'
      },
      publicKey: {
        type: 'string',
        description: 'Public key used for authentication'
      },
      password: {
        type: 'string',
        description: 'Password used for authentication'
      },
      accessLevel: {
        type: 'string',
        enum: ['read', 'full'],
        description: 'Set access level permissions for the SFTP user'
      }
    },
    required: ['description', 'directories'],
    additionalProperties: false
  }
};