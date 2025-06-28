import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_extension: Tool = {
  name: "mittwald_extension",
  description: "Get information about available extension management commands.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};