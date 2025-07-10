import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_domain_get_cli: Tool = {
  name: "mittwald_domain_get_cli",
  description: "Get domain information using CLI wrapper.",
  inputSchema: {
    type: "object",
    properties: {
      domainId: {
        type: "string",
        description: "The domain ID"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        description: "Output format (internally converted to JSON for processing)"
      }
    },
    required: ["domainId"]
  }
};