import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleRegistryUpdateCli } from '../../../../handlers/tools/mittwald-cli/registry/update-cli.js';

const tool: Tool = {
  name: 'mittwald_registry_update',
  title: 'Update Registry',
  description: 'Update an existing registry in Mittwald.',
  inputSchema: {
    type: 'object',
    properties: {
      registryId: {
        type: 'string',
        description: 'ID of the registry to update'
      },
      description: {
        type: 'string',
        description: 'New description for the registry'
      },
      uri: {
        type: 'string',
        description: 'New URI for the registry'
      },
      username: {
        type: 'string',
        description: 'Username for registry authentication'
      },
      password: {
        type: 'string',
        description: 'Password for registry authentication'
      }
    },
    required: ['registryId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleRegistryUpdateCli,
  schema: tool.inputSchema
};

export default registration;
