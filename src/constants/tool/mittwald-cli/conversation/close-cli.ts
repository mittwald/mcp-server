import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleConversationCloseCli } from '../../../../handlers/tools/mittwald-cli/conversation/close-cli.js';

const tool: Tool = {
  name: 'mittwald_conversation_close',
  title: 'Close Conversation',
  description: 'Close a conversation.',
  inputSchema: {
    type: 'object',
    properties: {
      conversationId: {
        type: 'string',
        description: 'ID of the conversation to close'
      }
    },
    required: ['conversationId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleConversationCloseCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_conversation_close_cli = tool;