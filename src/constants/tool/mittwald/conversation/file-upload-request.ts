import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldConversationFileUploadRequest: Tool = {
  name: "mittwald_conversation_file_upload_request",
  description: "Request a file upload token for a conversation to enable file attachments.",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        format: "uuid",
        description: "UUID of the conversation to request file upload token for"
      }
    },
    required: ["conversationId"]
  },
  _meta: {
    title: "Request File Upload Token",
    type: "server",
  },
};