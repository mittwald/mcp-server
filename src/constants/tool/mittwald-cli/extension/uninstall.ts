import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_extension_uninstall: Tool = {
  name: "mittwald_extension_uninstall",
  description: "Uninstall an extension from a project.",
  inputSchema: {
    type: "object",
    properties: {
      extensionInstanceId: {
        type: "string",
        description: "ID of the extensionInstance to be deleted"
      },
      wait: {
        type: "boolean",
        description: "Wait for the uninstallation to be finished"
      },
      waitTimeout: {
        type: "number",
        description: "Timeout for the wait operation in milliseconds"
      }
    },
    required: ["extensionInstanceId"]
  }
};