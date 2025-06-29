import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldUserSessionGetTool: Tool = {
  name: "mittwald_user_session_get",
  description: "Get details of a specific user session",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "ID of the session to retrieve"
      },
      output: {
        type: "string",
        enum: ["json", "yaml", "table"],
        description: "Output format",
        default: "json"
      }
    },
    required: ["sessionId"]
  }
};