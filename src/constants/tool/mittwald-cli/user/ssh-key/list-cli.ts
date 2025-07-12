import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleUserSshKeyListCli } from '../../../../../handlers/tools/mittwald-cli/user/ssh-key/list-cli.js';

const tool: Tool = {
  name: 'mittwald_user_ssh_key_list',
  description: 'Get your stored SSH keys using CLI wrapper. Lists all SSH keys for the current user.',
  inputSchema: {
    type: 'object',
    properties: {
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
        description: 'Hide table header'
      },
      noTruncate: {
        type: 'boolean',
        description: 'Do not truncate output (only relevant for txt output)'
      },
      noRelativeDates: {
        type: 'boolean',
        description: 'Show dates in absolute format, not relative (only relevant for txt output)'
      },
      csvSeparator: {
        type: 'string',
        enum: [',', ';'],
        description: 'Separator for CSV output (only relevant for CSV output)'
      }
    },
    additionalProperties: false
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleUserSshKeyListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_user_ssh_key_list_cli = tool;