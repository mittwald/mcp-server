import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldConversationMessageList: Tool = {
  name: "mittwald_conversation_message_list",
  description: "Get all messages in a conversation thread.",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        format: "uuid",
        description: "UUID of the conversation to get messages from"
      }
    },
    required: ["conversationId"]
  },
  _meta: {
    title: "List Messages",
    type: "server",
  },
};