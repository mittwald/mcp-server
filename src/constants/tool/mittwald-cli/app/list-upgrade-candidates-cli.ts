import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleAppListUpgradeCandidatesCli } from '../../../../handlers/tools/mittwald-cli/app/list-upgrade-candidates-cli.js';

const tool: Tool = {
  name: 'mittwald_app_list_upgrade_candidates',
  description: 'List upgrade candidates for an app installation using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      installationId: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml', 'csv', 'tsv'],
        description: 'Output format',
        default: 'txt'
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
        description: 'Separator for CSV output (only relevant for CSV output)',
        default: ','
      }
    }
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleAppListUpgradeCandidatesCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_app_list_upgrade_candidates_cli = tool;