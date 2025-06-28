import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ContextSetParameters {
  projectId?: string;
  serverId?: string;
  orgId?: string;
  installationId?: string;
}

export const mittwald_context_set: Tool = {
  name: 'mittwald_context_set',
  description: 'Set context values for the current project, org or server - allows you to persistently set values for common parameters',
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      serverId: {
        type: "string",
        description: "ID or short ID of a server"
      },
      orgId: {
        type: "string",
        description: "ID or short ID of an organization"
      },
      installationId: {
        type: "string",
        description: "ID or short ID of an app installation"
      }
    },
    required: [],
    // Note: JSON Schema doesn't have a direct equivalent to Zod's refine,
    // but we can add a comment about the validation requirement
    // The actual validation should be done in the handler implementation
    additionalProperties: false
  }
};