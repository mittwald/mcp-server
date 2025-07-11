import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleAppInstallWordpressCli } from '../../../../../handlers/tools/mittwald-cli/app/install/wordpress-cli.js';

const tool: Tool = {
  name: "mittwald_app_install_wordpress",
  description: "Install WordPress application using Mittwald CLI",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      version: {
        type: "string",
        description: "WordPress version to install (defaults to latest if not specified)"
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
        description: "Maximum time to wait in seconds",
        default: 600
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppInstallWordpressCli,
  schema: tool.inputSchema
};

export default registration;