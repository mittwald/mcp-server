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
