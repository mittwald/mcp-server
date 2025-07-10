import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleRegistryListCli } from '../../../../handlers/tools/mittwald-cli/container/registry-list-cli.js';

const tool: Tool = {
  name: 'mittwald_container_registry_list',
  description: 'List container registries using CLI wrapper',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml', 'csv', 'tsv'],
        description: 'Output format'
      },
      extended: {
        type: 'boolean',
        description: 'Show extended information'
      },
      noHeader: {
        type: 'boolean',
        description: 'Hide table header'
      },
      noTruncate: {
        type: 'boolean',
        description: 'Do not truncate output'
      },
      noRelativeDates: {
        type: 'boolean',
        description: 'Show dates in absolute format'
      },
      csvSeparator: {
        type: 'string',
        enum: [',', ';'],
        description: 'Separator for CSV output'
      }
    },
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleRegistryListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_container_registry_list_cli = tool;