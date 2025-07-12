import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleExtensionListCli } from '../../../../handlers/tools/mittwald-cli/extension/list-cli.js';

const tool: Tool = {
  name: 'mittwald_extension_list',
  description: 'List all available extensions using CLI wrapper',
  inputSchema: {
    type: 'object',
    properties: {
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

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleExtensionListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_extension_list_cli = tool;