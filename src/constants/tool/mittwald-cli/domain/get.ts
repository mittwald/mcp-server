import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const domain_get: Tool = {
  name: "mittwald_domain_get",
  description: "Gets a specific domain by ID or domain name. Returns detailed information about the domain configuration and settings.",
  inputSchema: {
    type: "object",
    properties: {
      domainId: {
        type: "string",
        description: "ID or domain name of a domain"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        default: "txt",
        description: "Output format"
      }
    },
    required: ["domainId"]
  }
};