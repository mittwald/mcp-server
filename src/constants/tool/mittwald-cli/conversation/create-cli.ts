import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleConversationCreateCli } from '../../../../handlers/tools/mittwald-cli/conversation/create-cli.js';

const tool: Tool = {
  name: 'mittwald_conversation_create',
  description: 'Create a new conversation using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title for the conversation'
      },
      message: {
        type: 'string',
        description: 'Message content for the conversation'
      },
      messageFrom: {
        type: 'string',
        description: 'Source of the message (file path)'
      },
      editor: {
        type: 'string',
        description: 'Editor to use for message input'
      },
      category: {
        type: 'string',
        description: 'Category for the conversation'
      }
    },
    required: ['title']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleConversationCreateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_conversation_create_cli = tool;