import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldConversationMembersGet: Tool = {
  name: "mittwald_conversation_members_get",
  description: "Get all members of a support conversation.",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        format: "uuid",
        description: "UUID of the conversation to get members from"
      }
    },
    required: ["conversationId"]
  },
  _meta: {
    title: "Get Conversation Members",
    type: "server",
  },
};