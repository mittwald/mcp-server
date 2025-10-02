import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleStackDeployCli } from '../../../../handlers/tools/mittwald-cli/stack/deploy-cli.js';

const tool: Tool = {
  name: 'mittwald_stack_deploy',
  title: 'Deploy Stack',
  description: 'Deploy a docker-compose compatible file to a Mittwald stack.',
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
      composeFile: {
        type: 'string',
        description: 'Path to a compose file, or "-" to read from stdin'
      },
      envFile: {
        type: 'string',
        description: 'Alternative path to file with environment variables'
      }
    },
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleStackDeployCli,
  schema: tool.inputSchema
};

export default registration;
