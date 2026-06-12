import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleStackDeployCli } from '../../../../handlers/tools/mittwald-cli/stack/deploy-cli.js';

const tool: Tool = {
  name: 'mittwald_stack_deploy',
  title: 'Deploy Stack',
  description: 'Deploy a docker-compose YAML configuration to a Mittwald stack. Accepts docker-compose format and converts it to Mittwald\'s native format. Note: This is a declarative API - the provided configuration REPLACES the entire stack. Any services or volumes not included will be DELETED.',
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'ID of the stack to deploy to'
      },
      composeYaml: {
        type: 'string',
        description: 'Docker-compose YAML content as a string. Supports services with image, ports, environment, volumes, command, and entrypoint. Example: "version: \'3\'\\nservices:\\n  web:\\n    image: nginx:alpine\\n    ports:\\n      - \'80:80\'"'
      },
      envOverrides: {
        type: 'object',
        description: 'Optional environment variable overrides to apply to all services (key-value pairs)',
        additionalProperties: { type: 'string' }
      }
    },
    required: ['stackId', 'composeYaml']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleStackDeployCli,
  schema: tool.inputSchema
};

export default registration;
