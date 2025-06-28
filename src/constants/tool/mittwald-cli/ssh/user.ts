import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldSshUserTool: Tool = {
  name: "mittwald_ssh_user",
  description: "Manage SSH users of your projects. This tool provides information about available SSH user commands.",
  inputSchema: {
    type: "object",
    properties: {
      help: {
        type: "boolean",
        description: "Show help information about SSH user commands",
        default: true
      }
    },
    additionalProperties: false
  }
};