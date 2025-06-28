import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldUserTool: Tool = {
  name: "mittwald_user",
  description: "Manage your own user account. This tool provides information about available user commands.",
  inputSchema: {
    type: "object",
    properties: {
      help: {
        type: "boolean",
        description: "Show help information about user commands",
        default: true
      }
    },
    additionalProperties: false
  }
};