import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleContextResetCli } from '../../../../handlers/tools/mittwald-cli/context/reset-cli.js';

export interface ContextResetCliParameters {
  // No specific parameters needed for reset
}

const tool: Tool = {
  name: 'mittwald_context_reset',
  title: 'Reset Context',
  description: 'Reset context parameters.',
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleContextResetCli,
  schema: tool.inputSchema
};

export default registration;