import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectInviteGetCli } from '../../../../handlers/tools/mittwald-cli/project/invite-get-cli.js';

const tool: Tool = {
  name: 'mittwald_project_invite_get',
  description: 'Get details of a project invite using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      inviteId: {
        type: 'string',
        description: 'ID of the invite to get details for'
      },
      output: {
        type: 'string',
        enum: ['json', 'table', 'yaml'],
        description: 'Output format (json, table, yaml)'
      }
    },
    required: ['inviteId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleProjectInviteGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_project_invite_get_cli = tool;