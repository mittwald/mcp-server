import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_install_wordpress: Tool = {
  name: "mittwald_app_install_wordpress",
  description: "Creates new WordPress installation.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      version: {
        type: "string",
        description: "REQUIRED: Exact WordPress version to install. You MUST first call mittwald_app_versions with app type 'wordpress' to get valid versions. Do NOT use 'latest' - choose the recommended version or a specific version from the list."
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
        description: "Title for the WordPress installation"
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
    required: ["projectId", "version"]
  }
};