import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_cronjob_execution: Tool = {
  name: "mittwald_cronjob_execution",
  description: "Cronjob execution management commands. This is a container tool for managing cronjob executions including abort, get, list, and logs operations.",
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        enum: ["abort", "get", "list", "logs"],
        description: "The execution command to run"
      },
      help: {
        type: "boolean",
        description: "Show help for cronjob execution commands"
      }
    },
    required: []
  }
};