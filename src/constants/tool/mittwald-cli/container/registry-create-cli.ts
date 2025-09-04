import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleRegistryCreateCli } from '../../../../handlers/tools/mittwald-cli/container/registry-create-cli.js';

const tool: Tool = {
  name: 'mittwald_container_registry_create',
  title: 'Create Container Registry',
  description: 'Create a new container registry.',
  inputSchema: {
    type: 'object',
    properties: {
      uri: {
        type: 'string',
        description: 'URI of the registry'
      },
      description: {
        type: 'string',
        description: 'Description of the registry'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
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
    required: ['uri', 'description']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleRegistryCreateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_container_registry_create_cli = tool;