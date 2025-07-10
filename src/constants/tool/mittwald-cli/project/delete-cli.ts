import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_delete_cli: Tool = {
  name: "mittwald_project_delete_cli",
  description: "Delete a project using Mittwald CLI",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      },
      force: {
        type: "boolean",
        description: "Do not ask for confirmation"
      }
    },
    required: ["projectId"]
  }
};