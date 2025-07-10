import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_get_cli: Tool = {
  name: "mittwald_project_get_cli",
  description: "Get details of a project using Mittwald CLI",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      output: {
        type: "string",
        description: "Output format",
        enum: ["txt", "json", "yaml"],
        default: "json"
      }
    },
    required: ["projectId"]
  }
};