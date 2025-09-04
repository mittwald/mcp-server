import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectInviteListOwnCli } from '../../../../handlers/tools/mittwald-cli/project/invite-list-own-cli.js';

const tool: Tool = {
  name: 'mittwald_project_invite_list_own',
  title: 'List My Project Invites',
  description: 'List own project invites.',
  inputSchema: {
    type: 'object',
    properties: {
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