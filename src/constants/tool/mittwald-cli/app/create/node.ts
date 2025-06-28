import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_create_node: Tool = {
  name: "mittwald_app_create_node",
  description: "Creates new custom Node.js installation",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      },
      siteTitle: {
        type: "string",
        description: "Site title for your custom Node.js installation"
      },
      entrypoint: {
        type: "string",
        description: "The command that should be used to start your custom Node.js application",
        default: "yarn start"
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
        type: "number",
        description: "The duration to wait for the resource to be ready in seconds",
        default: 600
      }
    },
    required: []
  }
};