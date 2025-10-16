import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleRegistryDeleteCli } from '../../../../handlers/tools/mittwald-cli/registry/delete-cli.js';

const tool: Tool = {
  name: 'mittwald_registry_delete',
  title: 'Delete Registry',
  description: 'Delete a registry from Mittwald.',
  inputSchema: {
    type: 'object',
    properties: {
      registryId: {
        type: 'string',
        description: 'ID of the registry to delete'
      },
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone).'
      },
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation'
      }
    },
    required: ['registryId', 'confirm']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleRegistryDeleteCli,
  schema: tool.inputSchema
};

export default registration;
