import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleOrgMembershipRevokeCli } from '../../../../handlers/tools/mittwald-cli/org/membership-revoke-cli.js';

const tool: Tool = {
  name: 'mittwald_org_membership_revoke',
  title: 'Revoke Organization Membership',
  description: 'Revoke a user\'s membership to an organization.',
  inputSchema: {
    type: 'object',
    properties: {
      membershipId: {
        type: 'string',
        description: 'Membership ID to revoke'
      },
      organizationId: {
        type: 'string',
        description: 'Organization ID related to the membership (optional)'
      },
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm revocation (DESTRUCTIVE OPERATION - cannot be undone).'
      }
    },
    required: ['membershipId', 'confirm']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleOrgMembershipRevokeCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_org_membership_revoke_cli = tool;
