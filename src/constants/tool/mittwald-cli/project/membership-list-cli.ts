import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectMembershipListCli } from '../../../../handlers/tools/mittwald-cli/project/membership-list-cli.js';

const tool: Tool = {
  name: 'mittwald_project_membership_list',
  title: 'List Project Members',
  description: 'List project memberships.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml', 'csv', 'tsv'],
        description: 'Output format (txt, json, yaml, csv, tsv)'
      },
      extended: {
        type: 'boolean',
        description: 'Show extended information'
      },
      noHeader: {
        type: 'boolean',
        description: 'Omit header row'
      },
      noTruncate: {
        type: 'boolean',
        description: 'Do not truncate output'
      },
      noRelativeDates: {
        type: 'boolean',
        description: 'Show absolute dates instead of relative dates'
      },
      csvSeparator: {
        type: 'string',
        enum: [',', ';'],
        description: 'CSV separator character'
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