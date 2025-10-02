import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleRegistryCreateCli } from '../../../../handlers/tools/mittwald-cli/registry/create-cli.js';

const tool: Tool = {
  name: 'mittwald_registry_create',
  title: 'Create Registry',
  description: 'Create a new registry in Mittwald.',
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
      username: {
        type: 'string',
        description: 'Username for registry authentication'
      },
      password: {
        type: 'string',
        description: 'Password for registry authentication'
      }
    },
    required: ["uri", "description", "projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleRegistryCreateCli,
  schema: tool.inputSchema
};

export default registration;
