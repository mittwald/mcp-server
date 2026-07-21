import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration, ToolHandler } from '../../../../types/tool-registry.js';
import { handleOrgInviteListOwnCli } from '../../../../handlers/tools/mittwald-cli/org/invite-list-own-cli.js';

const tool: Tool = {
  name: "mittwald_org_invite_list_own",
  title: "List My Organization Invites",
  description: "List all organization invites for the executing user.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

// Wrapper to adapt MittwaldToolHandler to ToolHandler
const handler: ToolHandler = async (args) => {
  return handleOrgInviteListOwnCli(args, {} as any);
};

const registration: ToolRegistration = {
  tool,
  handler,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_org_invite_list_own_cli = tool;