import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleOrgMembershipListOwnCli } from '../../../../handlers/tools/mittwald-cli/org/membership-list-own-cli.js';

const tool: Tool = {
  name: 'mittwald_org_membership_list_own',
  title: 'List My Organization Memberships',
  description: 'List all organization memberships for the authenticated user.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleOrgMembershipListOwnCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_org_membership_list_own_cli = tool;
