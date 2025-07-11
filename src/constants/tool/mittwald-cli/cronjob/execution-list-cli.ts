import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleCronjobExecutionListCli } from '../../../../handlers/tools/mittwald-cli/cronjob/execution-list-cli.js';

const tool: Tool = {
  name: 'mittwald_cronjob_execution_list',
  description: 'List cronjob executions using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      cronjobId: {
        type: 'string',
        description: 'ID or short ID of a cronjob'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml', 'csv', 'tsv'],
        description: 'Output format (txt, json, yaml, csv, tsv)'
      },
      extended: {
        type: 'boolean',
        description: 'Show extended information'
      },
      noHeader: {
        type: 'boolean',
        description: 'Omit header row'
      },
      noTruncate: {
        type: 'boolean',
        description: 'Do not truncate output'
      },
      noRelativeDates: {
        type: 'boolean',
        description: 'Show absolute dates instead of relative dates'
      },
      csvSeparator: {
        type: 'string',
        enum: [',', ';'],
        description: 'CSV separator character'
      }
    },
    required: ['cronjobId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleCronjobExecutionListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_cronjob_execution_list_cli = tool;