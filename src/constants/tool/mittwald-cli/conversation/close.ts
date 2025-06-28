import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const conversationCloseTool: Tool = {
  name: "mittwald_conversation_close",
  description: "Close a conversation",
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