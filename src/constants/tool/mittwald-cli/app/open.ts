import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_open: Tool = {
  name: "mittwald_app_open",
  description: "Open an app installation in the browser.",
  inputSchema: {
    type: "object",
    properties: {
      installationId: {
        type: "string",
        description: "ID or short ID of an app installation; this argument is optional if a default app installation is set in the context"
      }
    },
    required: []
  }
};