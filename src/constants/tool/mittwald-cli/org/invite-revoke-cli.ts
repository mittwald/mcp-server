import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration, ToolHandler } from '../../../../types/tool-registry.js';
import { handleOrgInviteRevokeCli } from '../../../../handlers/tools/mittwald-cli/org/invite-revoke-cli.js';

const tool: Tool = {
  name: "mittwald_org_invite_revoke",
  title: "Revoke Organization Invite",
  description: "Revoke an invite to an organization.",
  inputSchema: {
    type: "object",
    properties: {
      inviteId: {
        type: "string",
        description: "The ID of the invite to revoke"
      },
      confirm: {
        type: "boolean",
        description: "Must be set to true to confirm revocation (DESTRUCTIVE OPERATION - cannot be undone)."
      },
    },
    required: ["inviteId", "confirm"]
  }
};

// Wrapper to adapt MittwaldToolHandler to ToolHandler
const handler: ToolHandler = async (args, context) => {
  return handleOrgInviteRevokeCli(args, context as any);
};

const registration: ToolRegistration = {
  tool,
  handler,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_org_invite_revoke_cli = tool;
