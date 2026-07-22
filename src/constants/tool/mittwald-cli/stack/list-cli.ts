import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleStackListCli } from '../../../../handlers/tools/mittwald-cli/stack/list-cli.js';

const tool: Tool = {
  name: 'mittwald_stack_list',
  title: 'List Stacks',
  annotations: {
    title: 'List Stacks',
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description: 'List stacks for a given project.',
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
  handler: handleStackListCli,
  schema: tool.inputSchema
};

export default registration;
