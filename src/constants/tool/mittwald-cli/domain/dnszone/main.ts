import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const domain_dnszone_main: Tool = {
  name: "mittwald_domain_dnszone",
  description: "DNS zone management for Mittwald domains. Shows available DNS zone subcommands for managing DNS records and zones.",
  inputSchema: {
    type: "object",
    properties: {
      help: {
        type: "boolean",
        description: "Show help information for DNS zone management commands"
      }
    },
    required: []
  }
};