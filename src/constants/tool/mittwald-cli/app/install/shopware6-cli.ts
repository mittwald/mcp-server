import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleAppInstallShopware6Cli } from '../../../../../handlers/tools/mittwald-cli/app/install/shopware6-cli.js';

const tool: Tool = {
  name: "mittwald_app_install_shopware6",
  title: "Install Shopware 6",
  description: "Install Shopware 6 application.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      version: {
        type: "string",
        description: "Shopware 6 version to install (defaults to latest if not specified)"
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
        description: "Title for the Shopware 6 installation"
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
      quiet: {
        type: "boolean",
        description: "Only output the installation ID"
      },
      wait: {
        type: "boolean",
        description: "Wait for installation to complete"
      },
      waitTimeout: {
        type: "number",
        description: "Maximum time to wait in seconds"
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppInstallShopware6Cli,
  schema: tool.inputSchema
};

export default registration;