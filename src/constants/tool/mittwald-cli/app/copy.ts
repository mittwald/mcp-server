import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_copy: Tool = {
  name: "mittwald_app_copy",
  description: "Copy an app within a project",
  inputSchema: {
    type: "object",
    properties: {
      installationId: {
        type: "string",
        description: "ID or short ID of an app installation"
      },
      description: {
        type: "string",
        description: "Set a description for the new app installation"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      }
    },
    required: ["installationId", "description"]
  }
};