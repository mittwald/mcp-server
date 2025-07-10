import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ContextSetCliParameters {
  projectId?: string;
  serverId?: string;
  orgId?: string;
  installationId?: string;
  stackId?: string;
}

export const mittwald_context_set_cli: Tool = {
  name: 'mittwald_context_set_cli',
  description: 'Set context parameters using CLI wrapper',
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: 'The project ID to set as context'
      },
      serverId: {
        type: "string",
        description: 'The server ID to set as context'
      },
      orgId: {
        type: "string",
        description: 'The organization ID to set as context'
      },
      installationId: {
        type: "string",
        description: 'The installation ID to set as context'
      },
      stackId: {
        type: "string",
        description: 'The stack ID to set as context'
      }
    },
    required: [],
    anyOf: [
      { required: ["projectId"] },
      { required: ["serverId"] },
      { required: ["orgId"] },
      { required: ["installationId"] },
      { required: ["stackId"] }
    ]
  }
};