import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleOrgInviteCli } from '../../../../handlers/tools/mittwald-cli/org/invite-cli.js';

const tool: Tool = {
  name: 'mittwald_org_invite',
  title: 'Invite User to Organization',
  description: 'Invite a user to join an organization with a specified role.',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: {
        type: 'string',
        description: 'Organization ID that the user will be invited to (format: o-XXXXX)'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Email address of the user to invite'
      },
      role: {
        type: 'string',
        enum: ['owner', 'member', 'accountant'],
        description: 'Role to assign to the invited user'
      },
      message: {
        type: 'string',
        description: 'Optional message to include in the invitation email'
      },
      expires: {
        type: 'string',
        description: 'Optional expiry interval for the invitation (e.g. 30d, 12h)'
      }
    },
    required: ['organizationId', 'email', 'role']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleOrgInviteCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_org_invite_cli = tool;
