import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleStackPsCli } from '../../../../handlers/tools/mittwald-cli/stack/ps-cli.js';

const tool: Tool = {
  name: 'mittwald_stack_ps',
  title: 'List Stack Services',
  annotations: {
    title: 'List Stack Services',
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description: 'List all services within a given stack.',
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'ID of a stack'
      },
      projectId: {
        type: 'string',
        description: 'ID of the project containing the stack'
      }
    },
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleStackPsCli,
  schema: tool.inputSchema
};

export default registration;
