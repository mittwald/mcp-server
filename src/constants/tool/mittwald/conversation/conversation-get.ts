import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldConversationGet: Tool = {
  name: "mittwald_conversation_get",
  description: "Get details of a specific support conversation by its ID.",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        format: "uuid",
        description: "UUID of the conversation to retrieve"
      }
    },
    required: ["conversationId"]
  },
  _meta: {
    title: "Get Conversation",
    type: "server",
  },
};