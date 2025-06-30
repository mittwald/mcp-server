import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_install_shopware6: Tool = {
  name: "mittwald_app_install_shopware6",
  description: "Creates new Shopware 6 installation.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      version: {
        type: "string",
        description: "REQUIRED: Exact Shopware 6 version to install. You MUST first call mittwald_app_versions with app type 'shopware6' to get valid versions. Do NOT use 'latest' - choose the recommended version or a specific version from the list."
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
      adminFirstname: {
        type: "string",
        description: "Administrator first name"
      },
      adminLastname: {
        type: "string",
        description: "Administrator last name"
      },
      siteTitle: {
        type: "string",
        description: "Title for the Shopware installation"
      },
      shopEmail: {
        type: "string",
        description: "Shop email address"
      },
      shopLang: {
        type: "string",
        description: "Shop language"
      },
      shopCurrency: {
        type: "string",
        description: "Shop currency"
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