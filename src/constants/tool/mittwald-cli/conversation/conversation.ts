import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const conversationTool: Tool = {
  name: "mittwald_conversation",
  description: "Manage your support cases",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};