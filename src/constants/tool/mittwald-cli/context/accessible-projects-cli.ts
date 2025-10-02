import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleUserAccessibleProjectsCli } from '../../../../handlers/tools/mittwald-cli/context/accessible-projects-cli.js';

const tool: Tool = {
  name: 'mittwald_user_accessible_projects',
  title: 'List Accessible Projects',
  description: 'Get list of projects accessible to the current user session (session-aware, multi-tenant safe)',
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleUserAccessibleProjectsCli,
  schema: tool.inputSchema
};

export default registration;
