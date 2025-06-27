import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldConversationCreate: Tool = {
  name: "mittwald_conversation_create",
  description: "Create a new support conversation with specified title, category, and other properties.",
  inputSchema: {
    type: "object",
    properties: {
      categoryId: {
        type: "string",
        description: "The category ID for the conversation"
      },
      mainUserId: {
        type: "string",
        format: "uuid",
        description: "UUID of the main user for the conversation"
      },
      notificationRoles: {
        type: "array",
        items: {
          type: "object"
        },
        description: "Array of notification roles for the conversation"
      },
      relatedTo: {
        type: "object",
        description: "Reference to related aggregate (project, server, etc.)"
      },
      sharedWith: {
        type: "object", 
        description: "Shareable aggregate reference defining who can access the conversation"
      },
      title: {
        type: "string",
        description: "Title of the conversation"
      }
    },
    required: ["categoryId", "mainUserId", "notificationRoles", "relatedTo", "sharedWith", "title"]
  },
  _meta: {
    title: "Create Conversation",
    type: "server",
  },
};