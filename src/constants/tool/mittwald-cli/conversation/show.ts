import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const conversationShowTool: Tool = {
  name: "mittwald_conversation_show",
  description: "Show a conversation and message history",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        description: "ID or short ID of a conversation. Optional if a default conversation is set in the context"
      }
    },
    required: []
  }
};