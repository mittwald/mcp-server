import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_domain: Tool = {
  name: "mittwald_domain",
  description: "Get information about available domain management commands.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};