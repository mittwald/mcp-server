import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleVolumeDeleteCli } from '../../../../handlers/tools/mittwald-cli/volume/delete-cli.js';

const tool: Tool = {
  name: 'mittwald_volume_delete',
  title: 'Delete Volume',
  description: 'Delete a persistent volume. WARNING: This permanently removes stored data.',
  inputSchema: {
    type: 'object',
    properties: {
      volumeId: {
        type: 'string',
        description: 'Identifier of the volume to delete (accepts volume name as reported by the CLI).'
      },
      name: {
        type: 'string',
        description: 'Alias for volumeId; volume name as shown by `mw volume list`.',
        pattern: '^[a-z0-9-]+$'
      },
      projectId: {
        type: 'string',
        description: 'Project ID where the volume is located (format: p-xxxxx).'
      },
      force: {
        type: 'boolean',
        description: 'Force deletion even if the volume is still mounted to containers.'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress CLI progress output and return only the deleted volume name.'
      }
    },
    anyOf: [
      { required: ['volumeId'] },
      { required: ['name'] }
    ]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleVolumeDeleteCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_volume_delete_cli = tool;
