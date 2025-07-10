import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_ssh_cli: Tool = {
  name: 'mittwald_app_ssh_cli',
  description: 'Connect to an app via SSH using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      installationId: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context'
      },
      sshUser: {
        type: 'string',
        description: 'Override the SSH user to connect with; if omitted, your own user will be used'
      },
      sshIdentityFile: {
        type: 'string',
        description: 'The SSH identity file (private key) to use for public key authentication'
      },
      cd: {
        type: 'boolean',
        description: 'Change to installation path after connecting'
      },
      info: {
        type: 'boolean',
        description: 'Only print connection information, without actually connecting'
      },
      test: {
        type: 'boolean',
        description: 'Test connection and exit'
      }
    }
  }
};