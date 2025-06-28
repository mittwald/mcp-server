import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const conversationReplyTool: Tool = {
  name: "mittwald_conversation_reply",
  description: "Reply to a conversation",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        description: "ID or short ID of a conversation. Optional if a default conversation is set in the context"
      },
      message: {
        type: "string",
        description: "The body of the message to send"
      },
      messageFrom: {
        type: "string",
        description: "A file from which to read the message to send"
      },
      editor: {
        type: "string",
        description: "The editor to use when opening the message for editing",
        default: "vim"
      }
    },
    required: []
  }
};