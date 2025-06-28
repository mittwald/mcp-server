import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_domain_virtualhost_create: Tool = {
  name: "mittwald_domain_virtualhost_create",
  description: "Create a new ingress (virtual host).",
  inputSchema: {
    type: "object",
    properties: {
      hostname: {
        type: "string",
        description: "The hostname of the ingress"
      },
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      },
      pathToApp: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Add a path mapping to an app (format: path:appId, e.g. /:3ecaf1a9-6eb4-4869-b811-8a13c3a2e745)"
      },
      pathToUrl: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Add a path mapping to an external URL (format: path:url, e.g. /:https://redirect.example)"
      }
    },
    required: ["hostname"]
  }
};