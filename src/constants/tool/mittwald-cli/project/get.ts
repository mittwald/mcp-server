import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_get: Tool = {
  name: "mittwald_project_get",
  description: "Get a project.",
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
        enum: ["json", "table", "yaml"]
      }
    },
    required: ["projectId"]
  }
};