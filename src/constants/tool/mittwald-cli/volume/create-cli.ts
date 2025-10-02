import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleVolumeCreateCli } from '../../../../handlers/tools/mittwald-cli/volume/create-cli.js';

const tool: Tool = {
  name: 'mittwald_volume_create',
  title: 'Create Volume',
  description: 'Create a new named volume inside a project stack.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID where the volume should be created (format: p-xxxxx).'
      },
      name: {
        type: 'string',
        description: 'Unique volume name (lowercase letters, numbers and hyphen).',
        pattern: '^[a-z0-9-]+$'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress CLI progress output and return only the created volume name.'
      }
    },
    required: ['projectId', 'name']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleVolumeCreateCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_volume_create_cli = tool;
