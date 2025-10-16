import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleStackDeleteCli } from '../../../../handlers/tools/mittwald-cli/stack/delete-cli.js';

const tool: Tool = {
  name: 'mittwald_stack_delete',
  title: 'Delete Stack',
  description: 'Delete a stack.',
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'ID of a stack'
      },
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone).'
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
    required: ['confirm']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleStackDeleteCli,
  schema: tool.inputSchema
};

export default registration;
