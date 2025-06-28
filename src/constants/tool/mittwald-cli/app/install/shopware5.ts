import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_install_shopware5: Tool = {
  name: "mittwald_app_install_shopware5",
  description: "Creates new Shopware 5 installation.",
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
    required: ["projectId"]
  }
};