import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_ssh: Tool = {
  name: 'mittwald_project_ssh',
  description: 'Connect to a project via SSH. Establishes an interactive SSH connection to a project. This command is a wrapper around your systems SSH client.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this argument is optional if a default project is set in the context'
      },
      sshUser: {
        type: 'string',
        description: 'Override the SSH user to connect with; if omitted, your own user will be used'
      },
      sshIdentityFile: {
        type: 'string',
        description: 'The SSH identity file (private key) to use for public key authentication'
      }
    },
    required: [],
    additionalProperties: false
  }
};