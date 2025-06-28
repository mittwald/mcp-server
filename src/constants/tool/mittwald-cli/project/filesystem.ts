import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_filesystem: Tool = {
  name: "mittwald_project_filesystem",
  description: "Interact with the filesystem of your project.",
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The filesystem command to run",
        enum: ["usage"]
      },
      help: {
        type: "boolean",
        description: "Show help for project filesystem commands",
        default: false
      }
    },
    required: []
  }
};