import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldUserApiTokenRevokeTool: Tool = {
  name: "mittwald_user_api_token_revoke",
  description: "Revoke an API token",
  inputSchema: {
    type: "object",
    properties: {
      tokenId: {
        type: "string",
        description: "ID of the API token to revoke"
      },
      force: {
        type: "boolean",
        description: "Force revocation without confirmation",
        default: false
      }
    },
    required: ["tokenId"]
  }
};