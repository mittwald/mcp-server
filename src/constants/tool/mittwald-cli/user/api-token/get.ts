import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldUserApiTokenGetTool: Tool = {
  name: "mittwald_user_api_token_get",
  description: "Get a specific API token",
  inputSchema: {
    type: "object",
    properties: {
      tokenId: {
        type: "string",
        description: "The ID of the API token to retrieve"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        description: "Output format",
        default: "txt"
      }
    },
    required: ["tokenId"],
    additionalProperties: false
  }
};