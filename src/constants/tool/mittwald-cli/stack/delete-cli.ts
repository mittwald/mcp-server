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
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
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
