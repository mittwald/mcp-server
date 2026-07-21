import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleRegistryListCli } from '../../../../handlers/tools/mittwald-cli/registry/list-cli.js';

const tool: Tool = {
  name: 'mittwald_registry_list',
  title: 'List Registries',
  annotations: {
    title: 'List Registries',
    readOnlyHint: true,
    destructiveHint: false,
  },
  description: 'List registries available in Mittwald.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project'
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleRegistryListCli,
  schema: tool.inputSchema
};

export default registration;
