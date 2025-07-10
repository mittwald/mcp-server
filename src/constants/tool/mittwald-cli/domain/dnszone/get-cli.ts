import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_domain_dnszone_get_cli: Tool = {
  name: "mittwald_domain_dnszone_get_cli",
  description: "Get DNS zone information using CLI wrapper.",
  inputSchema: {
    type: "object",
    properties: {
      dnszoneId: {
        type: "string",
        description: "The DNS zone ID"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        description: "Output format (internally converted to JSON for processing)"
      }
    },
    required: ["dnszoneId"]
  }
};