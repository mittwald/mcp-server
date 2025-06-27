import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldConversationStatusSet: Tool = {
  name: "mittwald_conversation_status_set",
  description: "Update the status of a conversation. Status can be 'open', 'answered' or 'closed'. Open and answered appear as unresolved, while closed indicates a solved issue.",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        format: "uuid",
        description: "UUID of the conversation to update status for"
      },
      status: {
        type: "string",
        enum: ["open", "answered", "closed"],
        description: "New status for the conversation. 'open' and 'answered' show as unresolved, 'closed' shows as solved"
      }
    },
    required: ["conversationId", "status"]
  },
  _meta: {
    title: "Set Conversation Status",
    type: "server",
  },
};