import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_ssh: Tool = {
  name: "mittwald_app_ssh",
  description: "Connect to an app installation via SSH.",
  inputSchema: {
    type: "object",
    properties: {
      installationId: {
        type: "string",
        description: "ID or short ID of an app installation; this argument is optional if a default app installation is set in the context"
      },
      sshUser: {
        type: "string",
        description: "SSH user for the connection"
      },
      sshIdentityFile: {
        type: "string",
        description: "SSH private key file"
      },
      cd: {
        type: "boolean",
        description: "Change to installation path after connecting"
      },
      info: {
        type: "boolean",
        description: "Only print connection info without connecting"
      },
      test: {
        type: "boolean",
        description: "Test connection and exit"
      }
    },
    required: []
  }
};