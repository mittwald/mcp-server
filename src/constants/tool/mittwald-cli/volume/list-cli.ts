import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleVolumeListCli } from '../../../../handlers/tools/mittwald-cli/volume/list-cli.js';

const tool: Tool = {
  name: 'mittwald_volume_list',
  title: 'List Volumes',
  description: 'List persistent volumes that belong to a project stack.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to inspect (format: p-xxxxx).'
      },
      extended: {
        type: 'boolean',
        description: 'Include extended information returned by the Mittwald CLI.'
      },
      noHeader: {
        type: 'boolean',
        description: 'Hide table header in textual CLI output.'
      },
      noTruncate: {
        type: 'boolean',
        description: 'Do not truncate columns in textual CLI output.'
      },
      noRelativeDates: {
        type: 'boolean',
        description: 'Show absolute dates instead of relative ones.'
      },
      csvSeparator: {
        type: 'string',
        enum: [',', ';'],
        description: 'Separator used for CSV exports.'
      }
    },
    required: ['projectId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleVolumeListCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_volume_list_cli = tool;
