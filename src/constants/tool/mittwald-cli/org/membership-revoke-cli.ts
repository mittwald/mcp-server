import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration, ToolHandler } from '../../../../types/tool-registry.js';
import { handleOrgMembershipRevokeCli } from '../../../../handlers/tools/mittwald-cli/org/membership/revoke.js';

const tool: Tool = {
  name: "mittwald_org_membership_revoke",
  description: "Revoke a user's membership to an organization using CLI wrapper",
  inputSchema: {
    type: "object",
    properties: {
      membershipId: {
        type: "string",
        description: "The ID of the membership to revoke"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
        default: false
      }
    },
    required: ["membershipId"]
  }
};

// Wrapper to adapt MittwaldToolHandler to ToolHandler
const handler: ToolHandler = async (args) => {
  return handleOrgMembershipRevokeCli(args, {} as any);
};

const registration: ToolRegistration = {
  tool,
  handler,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_org_membership_revoke_cli = tool;