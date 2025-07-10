import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_download_cli: Tool = {
  name: 'mittwald_app_download_cli',
  description: 'Download the filesystem of an app within a project to your local machine using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      installationId: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context'
      },
      target: {
        type: 'string',
        description: 'Target directory to download the app installation to'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      sshUser: {
        type: 'string',
        description: 'Override the SSH user to connect with; if omitted, your own user will be used'
      },
      sshIdentityFile: {
        type: 'string',
        description: 'The SSH identity file (private key) to use for public key authentication'
      },
      exclude: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Exclude files matching the given patterns'
      },
      dryRun: {
        type: 'boolean',
        description: 'Do not actually download the app installation'
      },
      delete: {
        type: 'boolean',
        description: 'Delete local files that are not present on the server'
      },
      remoteSubDirectory: {
        type: 'string',
        description: 'Specify a sub-directory within the app installation to download'
      }
    },
    required: ['target']
  }
};