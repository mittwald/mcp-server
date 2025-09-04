import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleConversationReplyCli } from '../../../../handlers/tools/mittwald-cli/conversation/reply-cli.js';

const tool: Tool = {
  name: 'mittwald_conversation_reply',
  title: 'Reply to Conversation',
  description: 'Reply to a conversation.',
  inputSchema: {
    type: 'object',
    properties: {
      conversationId: {
        type: 'string',
        description: 'ID of the conversation to reply to'
      },
      message: {
        type: 'string',
        description: 'Message content for the reply'
      },
      messageFrom: {
        type: 'string',
        description: 'Source of the message (file path)'
      },
      editor: {
        type: 'string',
        description: 'Editor to use for message input'
      }
    },
    required: ['conversationId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleConversationReplyCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_conversation_reply_cli = tool;