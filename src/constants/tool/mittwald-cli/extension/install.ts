import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_extension_install: Tool = {
  name: "mittwald_extension_install",
  description: "Install an extension to a project.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      extensionId: {
        type: "string",
        description: "ID of the extension to install"
      },
      description: {
        type: "string",
        description: "Description for the extension installation"
      },
      consent: {
        type: "boolean",
        description: "Consent to the extension's terms and conditions"
      },
      wait: {
        type: "boolean",
        description: "Wait for the installation to complete"
      },
      waitTimeout: {
        type: "number",
        description: "Timeout in milliseconds to wait for the installation to complete"
      }
    },
    required: ["projectId", "extensionId"]
  }
};