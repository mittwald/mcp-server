import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldUserApiTokenListTool: Tool = {
  name: "mittwald_user_api_token_list",
  description: "List all API tokens for the authenticated user",
  inputSchema: {
    type: "object",
    properties: {
      output: {
        type: "string",
        enum: ["json", "yaml", "csv", "table"],
        description: "Output format",
        default: "json"
      },
      extended: {
        type: "boolean",
        description: "Show extended information",
        default: false
      },
      noHeader: {
        type: "boolean", 
        description: "Do not show header row",
        default: false
      },
      noTruncate: {
        type: "boolean",
        description: "Do not truncate output",
        default: false
      },
      noRelativeDates: {
        type: "boolean",
        description: "Do not use relative dates",
        default: false
      },
      csvSeparator: {
        type: "string",
        enum: [",", ";", "|"],
        description: "CSV separator character"
      }
    },
    required: []
  }
};