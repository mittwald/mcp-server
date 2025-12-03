import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleAppDependencyUpdateCli } from '../../../../handlers/tools/mittwald-cli/app/dependency-update-cli.js';

const tool: Tool = {
  name: 'mittwald_app_dependency_update',
  title: 'Update App Dependencies',
  description: 'Update one or more system software dependencies for an app installation.',
  inputSchema: {
    type: 'object',
    properties: {
      appId: {
        type: 'string',
        description: 'App installation ID (format: a-XXXXX).'
      },
      dependency: {
        type: 'string',
        description: 'Name of a dependency to update (e.g., php, node). Use together with the version field.'
      },
      version: {
        type: 'string',
        description: 'Target version or version range for the dependency specified in the dependency field.'
      },
      updates: {
        type: 'array',
        description: 'List of dependency updates to apply in one request.',
        items: {
          type: 'object',
          properties: {
            dependency: {
              type: 'string',
              description: 'Dependency name (e.g., php, node, composer).'
            },
            version: {
              type: 'string',
              description: 'Target version or semver constraint.'
            }
          },
          required: ['dependency', 'version']
        }
      },
      updatePolicy: {
        type: 'string',
        description: 'Update policy to apply after updating the dependency set.',
        enum: ['none', 'inheritedFromApp', 'patchLevel', 'all']
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress progress output and only return a summary from the CLI.'
      }
    },
    required: ['appId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppDependencyUpdateCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_app_dependency_update_cli = tool;
