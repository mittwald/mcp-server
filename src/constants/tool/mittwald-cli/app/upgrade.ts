import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_upgrade: Tool = {
  name: "mittwald_app_upgrade",
  description: "Upgrade an app installation to a different version.",
  inputSchema: {
    type: "object",
    properties: {
      installationId: {
        type: "string",
        description: "ID or short ID of an app installation; this argument is optional if a default app installation is set in the context"
      },
      targetVersion: {
        type: "string", 
        description: "Target version to upgrade to"
      },
      force: {
        type: "boolean",
        description: "Force the upgrade even if there are warnings"
      },
      skipValidation: {
        type: "boolean",
        description: "Skip validation of the upgrade"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      },
      wait: {
        type: "boolean",
        description: "Wait for the upgrade to complete"
      },
      waitTimeout: {
        type: "string",
        description: "Maximum time to wait for the upgrade to complete"
      }
    },
    additionalProperties: false
  }
};