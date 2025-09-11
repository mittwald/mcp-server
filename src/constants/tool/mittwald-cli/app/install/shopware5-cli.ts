import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleAppInstallShopware5Cli } from '../../../../../handlers/tools/mittwald-cli/app/install/shopware5-cli.js';

const tool: Tool = {
  name: "mittwald_app_install_shopware5",
  title: "Install Shopware 5",
  description: "Install Shopware 5 application.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      version: {
        type: "string",
        description: "Shopware 5 version to install (defaults to latest if not specified)"
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
        description: "Title for the Shopware 5 installation"
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

const registration: ToolRegistration = {
  tool,
  handler: handleAppInstallShopware5Cli,
  schema: tool.inputSchema
};

export default registration;