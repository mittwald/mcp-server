import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldConversationMessageCreate: Tool = {
  name: "mittwald_conversation_message_create",
  description: "Send a new message in a conversation. Supports text content up to 8000 characters and optional file attachments.",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        format: "uuid",
        description: "UUID of the conversation to send message to"
      },
      messageContent: {
        type: "string",
        maxLength: 8000,
        description: "The message content (max 8000 characters)"
      },
      fileIds: {
        type: "array",
        items: {
          type: "string",
          format: "uuid"
        },
        description: "Optional array of file IDs to attach to the message"
      }
    },
    required: ["conversationId", "messageContent"]
  },
  _meta: {
    title: "Create Message",
    type: "server",
  },
};