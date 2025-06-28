import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_create: Tool = {
  name: "mittwald_project_create",
  description: "Create a new project.",
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "A description for the project"
      },
      serverId: {
        type: "string",
        description: "Server ID to create project on"
      },
      wait: {
        type: "boolean",
        description: "Wait for operation to complete"
      },
      waitTimeout: {
        type: "number",
        description: "Timeout for wait operation in milliseconds",
        default: 300000
      },
      updateContext: {
        type: "boolean",
        description: "Update the CLI context to use the newly created project"
      }
    },
    required: ["description", "serverId"]
  }
};