import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_install_matomo: Tool = {
  name: "mittwald_app_install_matomo",
  description: "Creates new Matomo installation.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      version: {
        type: "string",
        description: "Version to install",
        default: "latest"
      },
      host: {
        type: "string",
        description: "Host to configure the app with"
      },
      adminUser: {
        type: "string",
        description: "Administrator username"
      },
      adminEmail: {
        type: "string",
        description: "Administrator email"
      },
      adminPass: {
        type: "string",
        description: "Administrator password"
      },
      siteTitle: {
        type: "string",
        description: "Title for the Matomo installation"
      },
      wait: {
        type: "boolean",
        description: "Wait for installation to complete"
      },
      waitTimeout: {
        type: "number",
        description: "Maximum time to wait in seconds",
        default: 600
      }
    },
    required: ["projectId"]
  }
};