import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleSessionAwareContextReset } from '../../../../handlers/tools/mittwald-cli/context/session-aware-context.js';

const tool: Tool = {
  name: 'mittwald_context_reset_session',
  title: 'Reset Session Context',
  description: 'Reset (clear) all user context parameters in Redis session (session-aware, multi-tenant safe)',
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleSessionAwareContextReset,
  schema: tool.inputSchema
};

export default registration;