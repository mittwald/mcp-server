import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_update_cli: Tool = {
  name: "mittwald_project_update_cli",
  description: "Update an existing project using Mittwald CLI",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      description: {
        type: "string",
        description: "Set the project description"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      }
    },
    required: ["projectId"]
  }
};