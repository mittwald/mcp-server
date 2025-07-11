import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleStackDeployCli } from '../../../../handlers/tools/mittwald-cli/container/stack-deploy-cli.js';

const tool: Tool = {
  name: 'mittwald_container_stack_deploy',
  description: 'Deploy a docker-compose compatible file to a mittwald container stack using CLI wrapper',
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

// Legacy export for backwards compatibility
export const mittwald_container_stack_deploy_cli = tool;