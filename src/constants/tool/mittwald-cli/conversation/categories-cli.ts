import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleConversationCategoriesCli } from '../../../../handlers/tools/mittwald-cli/conversation/categories-cli.js';

const tool: Tool = {
  name: 'mittwald_conversation_categories',
  title: 'List Conversation Categories',
  annotations: {
    title: 'List Conversation Categories',
    readOnlyHint: true,
    destructiveHint: false,
  },
  description: 'List conversation categories.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleConversationCategoriesCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_conversation_categories_cli = tool;