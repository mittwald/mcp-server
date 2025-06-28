import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldUserGetTool: Tool = {
  name: "mittwald_user_get",
  description: "Get profile information for a user",
  inputSchema: {
    type: "object",
    properties: {
      userId: {
        type: "string",
        description: "The user ID to get information for; defaults to 'self' for currently authenticated user",
        default: "self"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        description: "Output format",
        default: "txt"
      }
    },
    additionalProperties: false
  }
};