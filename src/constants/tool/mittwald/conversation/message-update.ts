import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldConversationMessageUpdate: Tool = {
  name: "mittwald_conversation_message_update",
  description: "Update the content of an existing message in a conversation.",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        format: "uuid",
        description: "UUID of the conversation containing the message"
      },
      messageId: {
        type: "string",
        format: "uuid", 
        description: "UUID of the message to update"
      },
      messageContent: {
        type: "string",
        description: "New content for the message"
      }
    },
    required: ["conversationId", "messageId", "messageContent"]
  },
  _meta: {
    title: "Update Message",
    type: "server",
  },
};