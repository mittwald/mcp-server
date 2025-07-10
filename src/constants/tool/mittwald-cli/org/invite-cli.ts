import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleOrgInviteCli } from '../../../../handlers/tools/mittwald-cli/org/invite.js';

const tool: Tool = {
  name: "mittwald_org_invite_cli",
  description: "Invite a user to an organization using CLI wrapper",
  inputSchema: {
    type: "object",
    properties: {
      orgId: {
        type: "string",
        description: "ID or short ID of an org; this parameter is optional if a default org is set in the context"
      },
      email: {
        type: "string",
        description: "The email address of the user to invite"
      },
      role: {
        type: "string",
        description: "The role of the user to invite",
        enum: ["owner", "member", "accountant"],
        default: "member"
      },
      message: {
        type: "string",
        description: "A message to include in the invitation email"
      },
      expires: {
        type: "string",
        description: "An interval after which the invitation expires (examples: 30m, 30d, 1y)"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
        default: false
      }
    },
    required: ["email"]
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