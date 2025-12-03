import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleAppDependencyListCli } from '../../../../handlers/tools/mittwald-cli/app/dependency-list-cli.js';

const tool: Tool = {
  name: 'mittwald_app_dependency_list',
  title: 'List App Dependencies',
  description: 'Get all available system software dependencies and optionally filter by app type or installation.',
  inputSchema: {
    type: 'object',
    properties: {
      appType: {
        type: 'string',
        description: "Optional filter by application type tag (for example 'wordpress', 'nodejs', 'php')."
      },
      appId: {
        type: 'string',
        description: 'Optional app installation ID (format: a-XXXXX) used to enrich results with current versions.'
      },
      includeMetadata: {
        type: 'boolean',
        description: 'Include metadata returned by the CLI in the response payload.'
      }
    },
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppDependencyListCli,
  schema: tool.inputSchema
};

export default registration;

export const mittwald_app_dependency_list_cli = tool;
