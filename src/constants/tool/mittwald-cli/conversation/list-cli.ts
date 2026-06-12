import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleConversationListCli } from '../../../../handlers/tools/mittwald-cli/conversation/list-cli.js';

const tool: Tool = {
  name: 'mittwald_conversation_list',
  title: 'List Conversations',
  description: 'List conversations.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleConversationListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_conversation_list_cli = tool;