import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleAppInstallTypo3Cli } from '../../../../../handlers/tools/mittwald-cli/app/install/typo3-cli.js';

const tool: Tool = {
  name: "mittwald_app_install_typo3",
  title: "Install TYPO3",
  description: "Install TYPO3 application.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      version: {
        type: "string",
        description: "TYPO3 version to install (defaults to latest if not specified)"
      },
      installMode: {
        type: "string",
        description: "Installation mode (composer or symlink, defaults to composer if not specified)",
        enum: ["composer", "symlink"]
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
        description: "Title for the TYPO3 installation"
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
  handler: handleAppInstallTypo3Cli,
  schema: tool.inputSchema
};

export default registration;