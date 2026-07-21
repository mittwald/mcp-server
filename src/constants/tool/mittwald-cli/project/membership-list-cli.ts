import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectMembershipListCli } from '../../../../handlers/tools/mittwald-cli/project/membership-list-cli.js';

const tool: Tool = {
  name: 'mittwald_project_membership_list',
  title: 'List Project Members',
  annotations: {
    title: 'List Project Members',
    readOnlyHint: true,
    destructiveHint: false,
  },
  description: 'List project memberships.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project'
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleProjectMembershipListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_project_membership_list_cli = tool;