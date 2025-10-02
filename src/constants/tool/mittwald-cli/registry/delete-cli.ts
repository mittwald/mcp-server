import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleRegistryDeleteCli } from '../../../../handlers/tools/mittwald-cli/registry/delete-cli.js';

const tool: Tool = {
  name: 'mittwald_registry_delete',
  title: 'Delete Registry',
  description: 'Delete a registry.',
  inputSchema: {
    type: 'object',
    properties: {
      registryId: {
        type: 'string',
        description: 'ID of the registry to delete'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation'
      }
    },
    required: ['registryId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleRegistryDeleteCli,
  schema: tool.inputSchema
};

export default registration;
