import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleOrgListCli } from '../../../../handlers/tools/mittwald-cli/org/list-cli.js';

const tool: Tool = {
  name: 'mittwald_org_list',
  title: 'List Organizations',
  description: 'Get all organizations the authenticated user has access to.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleOrgListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_org_list_cli = tool;
