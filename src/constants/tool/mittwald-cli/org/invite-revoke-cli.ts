import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleOrgInviteRevokeCli } from '../../../../handlers/tools/mittwald-cli/org/invite-revoke-cli.js';

const tool: Tool = {
  name: "mittwald_org_invite_revoke_cli",
  description: "Revoke an invite to an organization using CLI wrapper",
  inputSchema: {
    type: "object",
    properties: {
      inviteId: {
        type: "string",
        description: "The ID of the invite to revoke"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
        default: false
      }
    },
    required: ["inviteId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleOrgInviteRevokeCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_org_invite_revoke_cli = tool;