import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldConversationUpdate: Tool = {
  name: "mittwald_conversation_update",
  description: "Update the basic properties of a conversation including title, category, and related references.",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        format: "uuid",
        description: "UUID of the conversation to update"
      },
      categoryId: {
        type: "string",
        format: "uuid",
        description: "New category ID for the conversation (optional)"
      },
      relatedTo: {
        type: "object",
        description: "New related aggregate reference (optional)"
      },
      title: {
        type: "string",
        description: "New title for the conversation (optional)"
      }
    },
    required: ["conversationId"]
  },
  _meta: {
    title: "Update Conversation",
    type: "server",
  },
};