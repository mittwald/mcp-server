import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ContextParameters {
  command: 'get' | 'reset' | 'set';
  // Set command parameters
  projectId?: string;
  serverId?: string;
  orgId?: string;
  installationId?: string;
  // Get command parameters
  output?: 'txt' | 'json';
}

export const mittwald_context: Tool = {
  name: 'mittwald_context',
  description: 'Save certain environment parameters for later use - get, reset, or set context values',
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        enum: ["get", "reset", "set"],
        description: "The context command to execute"
      },
      // Set command parameters
      projectId: {
        type: "string",
        description: "ID or short ID of a project (set command)"
      },
      serverId: {
        type: "string",
        description: "ID or short ID of a server (set command)"
      },
      orgId: {
        type: "string",
        description: "ID or short ID of an organization (set command)"
      },
      installationId: {
        type: "string",
        description: "ID or short ID of an app installation (set command)"
      },
      // Get command parameters
      output: {
        type: "string",
        enum: ["txt", "json"],
        description: "Output format for get command"
      }
    },
    required: ["command"]
  }
};