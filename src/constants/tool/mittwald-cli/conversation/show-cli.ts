import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleConversationShowCli } from '../../../../handlers/tools/mittwald-cli/conversation/show-cli.js';

const tool: Tool = {
  name: 'mittwald_conversation_show',
  description: 'Show details of a conversation using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      conversationId: {
        type: 'string',
        description: 'ID of the conversation to show'
      }
    },
    required: ['conversationId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleConversationShowCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_conversation_show_cli = tool;