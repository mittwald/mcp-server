import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_create_cli: Tool = {
  name: "mittwald_project_create_cli",
  description: "Create a new project using Mittwald CLI",
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "A description for the project"
      },
      serverId: {
        type: "string",
        description: "ID or short ID of a server; this flag is optional if a default server is set in the context"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      },
      wait: {
        type: "boolean",
        description: "Wait for the resource to be ready"
      },
      waitTimeout: {
        type: "string",
        description: "The duration to wait for the resource to be ready (common units like 'ms', 's', 'm' are accepted)",
        default: "600s"
      },
      updateContext: {
        type: "boolean",
        description: "Update the CLI context to use the newly created project"
      }
    },
    required: ["description"]
  }
};