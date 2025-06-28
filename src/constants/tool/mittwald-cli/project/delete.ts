import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_delete: Tool = {
  name: "mittwald_project_delete",
  description: "Delete a project.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      force: {
        type: "boolean",
        description: "Do not ask for confirmation (required in MCP context)"
      }
    },
    required: ["projectId", "force"]
  }
};