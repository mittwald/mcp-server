import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_filesystem_usage: Tool = {
  name: "mittwald_project_filesystem_usage",
  description: "Get a project directory filesystem usage.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      human: {
        type: "boolean",
        description: "Display human readable sizes."
      }
    },
    required: ["projectId"]
  }
};