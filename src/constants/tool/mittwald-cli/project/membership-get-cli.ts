import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectMembershipGetCli } from '../../../../handlers/tools/mittwald-cli/project/membership-get-cli.js';

const tool: Tool = {
  name: 'mittwald_project_membership_get',
  title: 'Get Project Membership Details',
  description: 'Get details of a project membership.',
  inputSchema: {
    type: 'object',
    properties: {
      membershipId: {
        type: 'string',
        description: 'ID of the membership to get details for'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (txt, json, yaml)'
      }
    },
    required: ['membershipId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleProjectMembershipGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_project_membership_get_cli = tool;