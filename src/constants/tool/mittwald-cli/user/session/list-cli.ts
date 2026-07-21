import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleUserSessionListCli } from '../../../../../handlers/tools/mittwald-cli/user/session/list-cli.js';

const tool: Tool = {
  name: 'mittwald_user_session_list',
  title: 'List My Sessions',
  annotations: {
    title: 'List My Sessions',
    readOnlyHint: true,
    destructiveHint: false,
  },
  description: 'List all active sessions.. Shows all active sessions for the current user.',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleUserSessionListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_user_session_list_cli = tool;