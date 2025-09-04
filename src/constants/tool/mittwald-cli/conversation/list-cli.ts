import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleConversationListCli } from '../../../../handlers/tools/mittwald-cli/conversation/list-cli.js';

const tool: Tool = {
  name: 'mittwald_conversation_list',
  title: 'List Conversations',
  description: 'List conversations.',
  inputSchema: {
    type: 'object',
    properties: {
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
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleConversationListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_conversation_list_cli = tool;