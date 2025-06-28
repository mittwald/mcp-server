import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldUserApiTokenTool: Tool = {
  name: "mittwald_user_api_token",
  description: "Manage API tokens. This tool provides information about available API token commands.",
  inputSchema: {
    type: "object",
    properties: {
      help: {
        type: "boolean",
        description: "Show help information about API token commands",
        default: true
      }
    },
    additionalProperties: false
  }
};