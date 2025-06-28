import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_create_static: Tool = {
  name: "mittwald_app_create_static",
  description: "Creates new custom static site installation",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      },
      documentRoot: {
        type: "string",
        description: "Document root for static site serving (relative to installation path)",
        default: "/"
      },
      siteTitle: {
        type: "string",
        description: "Site title for your static site installation"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      },
      wait: {
        type: "boolean",
        description: "Wait for the resource to be ready"
      },
      waitTimeout: {
        type: "number",
        description: "The duration to wait for the resource to be ready in seconds",
        default: 600
      }
    },
    required: ["documentRoot"]
  }
};