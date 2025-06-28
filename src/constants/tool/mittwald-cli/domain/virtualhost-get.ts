import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_domain_virtualhost_get: Tool = {
  name: "mittwald_domain_virtualhost_get",
  description: "Get a virtual host.",
  inputSchema: {
    type: "object",
    properties: {
      ingressId: {
        type: "string",
        description: "ID of the ingress to retrieve"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        description: "Output format",
        default: "txt"
      }
    },
    required: ["ingressId", "output"]
  }
};