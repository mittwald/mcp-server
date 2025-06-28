import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const ddev_main: Tool = {
  name: "mittwald_ddev",
  description: "Integrate your mittwald projects with DDEV. Shows available DDEV subcommands for working with local development environments.",
  inputSchema: {
    type: "object",
    properties: {
      help: {
        type: "boolean",
        description: "Show help information for DDEV integration commands"
      }
    },
    required: []
  }
};