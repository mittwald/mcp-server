import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_domain_virtualhost_create: Tool = {
  name: "mittwald_domain_virtualhost_create",
  description: "Create a new ingress (virtual host). CONTAINER IDs: You can use either short IDs (e.g., 'c-ba5s0g') or full UUIDs - the system will automatically resolve short IDs to UUIDs. SUBDOMAINS: You can create subdomains like 'opensearch.p-b95iip.project.space' for any project. PATH FORMAT: Use format ['/:containerId:PORT/tcp']. EXAMPLES: pathToContainer: ['/:c-ba5s0g:5601/tcp'] or ['/:c440aa00-ece8-496f-bfaa-a3237f589535:5601/tcp']. At least one path mapping (pathToApp, pathToUrl, or pathToContainer) is required.",
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
        description: "Add a path mapping to a container. Format: 'path:containerId:port'. You can use either short IDs (e.g., '/:c-ba5s0g:5601/tcp') or full UUIDs (e.g., '/:c440aa00-ece8-496f-bfaa-a3237f589535:5601/tcp'). The system automatically resolves short IDs to UUIDs."
      }
    },
    required: ["hostname"]
  }
};