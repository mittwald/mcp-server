import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldUserApiTokenCreateTool: Tool = {
  name: "mittwald_user_api_token_create",
  description: "Create a new API token",
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "Description of the API token"
      },
      roles: {
        type: "array",
        items: {
          type: "string",
          enum: ["api_read", "api_write"]
        },
        description: "Roles of the API token",
        minItems: 1
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
        default: false
      },
      expires: {
        type: "string",
        description: "An interval after which the API token expires (examples: 30m, 30d, 1y)"
      }
    },
    required: ["description", "roles"],
    additionalProperties: false
  }
};