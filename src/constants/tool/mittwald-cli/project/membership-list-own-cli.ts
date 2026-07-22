import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectMembershipListOwnCli } from '../../../../handlers/tools/mittwald-cli/project/membership-list-own-cli.js';

const tool: Tool = {
  name: 'mittwald_project_membership_list_own',
  title: 'List My Project Memberships',
  annotations: {
    title: 'List My Project Memberships',
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description: 'List own project memberships.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleProjectMembershipListOwnCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_project_membership_list_own_cli = tool;