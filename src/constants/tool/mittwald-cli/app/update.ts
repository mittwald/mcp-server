import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_update: Tool = {
  name: "mittwald_app_update",
  description: "Update properties of an app installation (use 'upgrade' to update the app version).",
  inputSchema: {
    type: "object",
    properties: {
      installationId: {
        type: "string",
        description: "ID or short ID of an app installation; this argument is optional if a default app installation is set in the context"
      },
      description: {
        type: "string",
        description: "Update the description of the app installation"
      },
      documentRoot: {
        type: "string",
        description: "Update the document root of the app installation"
      },
      entrypoint: {
        type: "string",
        description: "Update the entrypoint of the app installation (Python and Node.js only)"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      }
    },
    required: []
  }
};