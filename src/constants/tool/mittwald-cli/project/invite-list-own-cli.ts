import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectInviteListOwnCli } from '../../../../handlers/tools/mittwald-cli/project/invite-list-own-cli.js';

const tool: Tool = {
  name: 'mittwald_project_invite_list_own',
  title: 'List My Project Invites',
  description: 'List own project invites.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleProjectInviteListOwnCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_project_invite_list_own_cli = tool;