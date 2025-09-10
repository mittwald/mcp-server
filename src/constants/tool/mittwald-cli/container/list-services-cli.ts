import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleContainerListCli } from '../../../../handlers/tools/mittwald-cli/container/list-services-cli.js';

const tool: Tool = {
  name: 'mittwald_container_list',
  title: 'List Containers',
  description: 'List containers belonging to a project.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project (optional if default project is set in context)'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml', 'csv', 'tsv'],
        description: 'Output format (default: txt)'
      },
      extended: {
        type: 'boolean',
        description: 'Show extended information'
      },
      noHeader: {
        type: 'boolean',
        description: 'Hide table header (only relevant for table output)'
      },
      noTruncate: {
        type: 'boolean',
        description: 'Do not truncate output (only relevant for table output)'
      },
      noRelativeDates: {
        type: 'boolean',
        description: 'Show dates in absolute format, not relative'
      },
      csvSeparator: {
        type: 'string',
        enum: [',', ';'],
        description: 'Separator for CSV output (only relevant for CSV output)'
      }
    },
    required: ["projectId"]
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleContainerListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_container_list_cli = tool;