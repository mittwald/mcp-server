import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_download: Tool = {
  name: 'mittwald_app_download',
  description: 'Download the filesystem of an app within a project to your local machine',
  inputSchema: {
    type: 'object',
    properties: {
      installation_id: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context',
      },
      target: {
        type: 'string',
        description: 'Target directory to download the app installation to',
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary',
        default: false,
      },
      ssh_user: {
        type: 'string',
        description: 'Override the SSH user to connect with; if omitted, your own user will be used',
      },
      ssh_identity_file: {
        type: 'string',
        description: 'The SSH identity file (private key) to use for public key authentication',
      },
      exclude: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Exclude files matching the given pattern',
      },
      dry_run: {
        type: 'boolean',
        description: 'Do not actually download the app installation',
        default: false,
      },
      delete: {
        type: 'boolean',
        description: 'Delete local files that are not present on the server',
        default: false,
      },
      remote_sub_directory: {
        type: 'string',
        description: 'Specify a sub-directory within the app installation to download',
      },
    },
    required: ['target'],
  },
};