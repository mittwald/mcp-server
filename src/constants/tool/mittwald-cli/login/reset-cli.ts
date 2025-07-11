import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleLoginResetCli } from '../../../../handlers/tools/mittwald-cli/login/reset-cli.js';

export interface LoginResetCliParameters {
  // No specific parameters needed for reset
}

const tool: Tool = {
  name: 'mittwald_login_reset',
  description: 'Reset login session using CLI wrapper',
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleLoginResetCli,
  schema: tool.inputSchema
};

export default registration;