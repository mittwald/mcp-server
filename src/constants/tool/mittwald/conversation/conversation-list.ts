import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldConversationList: Tool = {
  name: "mittwald_conversation_list",
  description: "List all conversations the authenticated user has created or has access to. Supports sorting by various fields like creation date, last message date, title, priority, and more.",
  inputSchema: {
    type: "object",
    properties: {
      sort: {
        type: "array",
        items: {
          type: "string",
          enum: ["createdAt", "lastMessage.createdAt", "title", "priority", "shortId", "conversationId"]
        },
        description: "Array of fields to sort by. Default is 'lastMessage.createdAt'"
      },
      order: {
        type: "array", 
        items: {
          type: "string",
          enum: ["asc", "desc"]
        },
        description: "Sort order for each field. Default is 'desc'"
      }
    }
  },
  _meta: {
    title: "List Conversations",
    type: "server",
  },
};