import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleStackDeleteCli } from '../../../../handlers/tools/mittwald-cli/container/stack-delete-cli.js';

const tool: Tool = {
  name: 'mittwald_container_stack_delete',
  title: 'Delete Container Stack',
  description: 'Delete a container stack.',
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'ID of a stack'
      },
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation'
      },
      withVolumes: {
        type: 'boolean',
        description: 'Also include remove volumes in removal'
      }
    },
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleStackDeleteCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_container_stack_delete_cli = tool;