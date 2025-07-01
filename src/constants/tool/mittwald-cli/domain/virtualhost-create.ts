import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_domain_virtualhost_create: Tool = {
  name: "mittwald_domain_virtualhost_create",
  description: "Create a new ingress (virtual host). IMPORTANT: At least one path mapping (pathToApp, pathToUrl, or pathToContainer) is required. App IDs start with 'a-', Container IDs start with 'c-'. Examples: pathToApp: ['/:a-3c96b5'], pathToContainer: ['/:c-f6kw84:5601/tcp'] for OpenSearch Dashboard, pathToUrl: ['/api:https://api.example.com'].",
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
        description: "Add a path mapping to an app (format: path:appId, e.g. '/:a-3c96b5' or '/:3ecaf1a9-6eb4-4869-b811-8a13c3a2e745'). App IDs start with 'a-'."
      },
      pathToUrl: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Add a path mapping to an external URL (format: path:url, e.g. /:https://redirect.example)"
      },
      pathToContainer: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Add a path mapping to a container (format: path:containerId:port, e.g. '/:c-f6kw84:5601/tcp' or '/:3f7d4b6a-uuid:8080/tcp'). Container IDs start with 'c-'."
      }
    },
    required: ["hostname"]
  }
};