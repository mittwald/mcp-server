import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleBackupGetCli } from '../../../../handlers/tools/mittwald-cli/backup/get-cli.js';

const tool: Tool = {
  name: 'mittwald_backup_get',
  description: 'Get details of a backup using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      backupId: {
        type: 'string',
        description: 'ID or short ID of a backup'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (txt, json, yaml)'
      }
    },
    required: ['backupId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleBackupGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_backup_get_cli = tool;