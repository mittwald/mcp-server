import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleAppInstallMatomoCli } from '../../../../../handlers/tools/mittwald-cli/app/install/matomo-cli.js';

const tool: Tool = {
  name: "mittwald_app_install_matomo",
  title: "Install Matomo",
  description: "Install Matomo application.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      version: {
        type: "string",
        description: "Matomo version to install (defaults to latest if not specified)"
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

const registration: ToolRegistration = {
  tool,
  handler: handleAppInstallMatomoCli,
  schema: tool.inputSchema
};

export default registration;