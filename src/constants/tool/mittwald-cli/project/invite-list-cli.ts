import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectInviteListCli } from '../../../../handlers/tools/mittwald-cli/project/invite-list-cli.js';

const tool: Tool = {
  name: 'mittwald_project_invite_list',
  title: 'List Project Invites',
  annotations: {
    title: 'List Project Invites',
    readOnlyHint: true,
    destructiveHint: false,
  },
  description: 'List project invites.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this argument is optional if a default project is set in the context'
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleProjectInviteListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_project_invite_list_cli = tool;