import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleOrgMembershipListCli } from '../../../../handlers/tools/mittwald-cli/org/membership-list-cli.js';

const tool: Tool = {
  name: 'mittwald_org_membership_list',
  title: 'List Organization Members',
  description: 'List all memberships belonging to an organization.',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: {
        type: 'string',
        description: 'Organization ID to list memberships for (format: o-XXXXX)'
      }
    },
    required: ['organizationId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleOrgMembershipListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_org_membership_list_cli = tool;
