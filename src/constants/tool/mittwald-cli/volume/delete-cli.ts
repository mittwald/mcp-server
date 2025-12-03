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
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone).'
      },
      force: {
        type: 'boolean',
        description: 'Force deletion even if the volume is still mounted to containers (use with extreme caution).'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress CLI progress output and return only the deleted volume name.'
      }
    },
    required: ['projectId', 'confirm'],
    additionalProperties: false
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleVolumeDeleteCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_volume_delete_cli = tool;
