import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_create_python: Tool = {
  name: "mittwald_app_create_python",
  description: "Creates new custom python site installation",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      },
      siteTitle: {
        type: "string",
        description: "Site title for your python site installation"
      },
      entrypoint: {
        type: "string",
        description: "Command to start the python application"
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