import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleAppDependencyVersionsCli } from '../../../../handlers/tools/mittwald-cli/app/dependency-versions-cli.js';

const tool: Tool = {
  name: 'mittwald_app_dependency_versions',
  title: 'List Dependency Versions',
  description: 'Fetch available versions for a specific system software dependency.',
  inputSchema: {
    type: 'object',
    properties: {
      dependency: {
        type: 'string',
        description: 'Name of the dependency to retrieve versions for (e.g., php, node, composer).',
      },
      versionRange: {
        type: 'string',
        description: 'Optional semver constraint to filter the returned versions.',
      },
      recommendedOnly: {
        type: 'boolean',
        description: 'Return only versions flagged as recommended.',
        default: false,
      },
      includeDependencies: {
        type: 'boolean',
        description: 'Include nested dependency metadata in the response payload.',
        default: false,
      },
    },
    required: ['dependency'],
  },
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppDependencyVersionsCli,
  schema: tool.inputSchema,
};

export default registration;

export const mittwald_app_dependency_versions_cli = tool;
