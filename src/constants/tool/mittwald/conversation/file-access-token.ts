import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldConversationFileAccessToken: Tool = {
  name: "mittwald_conversation_file_access_token",
  description: "Request an access token for a file belonging to a conversation to enable file downloads.",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        format: "uuid",
        description: "UUID of the conversation containing the file"
      },
      fileId: {
        type: "string",
        format: "uuid",
        description: "UUID of the file to get access token for"
      }
    },
    required: ["conversationId", "fileId"]
  },
  _meta: {
    title: "Get File Access Token",
    type: "server",
  },
};