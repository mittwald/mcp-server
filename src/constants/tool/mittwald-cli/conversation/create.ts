import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const conversationCreateTool: Tool = {
  name: "mittwald_conversation_create",
  description: "Create a new conversation",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Title of the conversation"
      },
      message: {
        type: "string",
        description: "The body of the message to send"
      },
      messageFrom: {
        type: "string",
        description: "A file from which to read the message to send"
      },
      category: {
        type: "string",
        description: "Category of the conversation",
        default: "general"
      },
      editor: {
        type: "string",
        description: "The editor to use when opening the message for editing",
        default: "vim"
      }
    },
    required: ["title"]
  }
};