import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectMembershipGetOwnCli } from '../../../../handlers/tools/mittwald-cli/project/membership-get-own-cli.js';

const tool: Tool = {
  name: 'mittwald_project_membership_get_own',
  description: 'Get details of own project membership using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (txt, json, yaml)'
      }
    },
    required: ['projectId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleProjectMembershipGetOwnCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_project_membership_get_own_cli = tool;