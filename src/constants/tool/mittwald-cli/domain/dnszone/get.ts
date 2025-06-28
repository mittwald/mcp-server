import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const domain_dnszone_get: Tool = {
  name: "mittwald_domain_dnszone_get",
  description: "Gets a specific DNS zone by ID or domain name. Returns detailed information about the DNS zone configuration.",
  inputSchema: {
    type: "object",
    properties: {
      dnszoneId: {
        type: "string",
        description: "ID or domain name of a DNS zone"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        default: "txt",
        description: "Output format"
      }
    },
    required: ["dnszoneId"]
  }
};