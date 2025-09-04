import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleBackupDeleteCli } from '../../../../handlers/tools/mittwald-cli/backup/delete-cli.js';

const tool: Tool = {
  name: 'mittwald_backup_delete',
  title: 'Delete Backup',
  description: 'Delete a backup',
  inputSchema: {
    type: 'object',
    properties: {
      backupId: {
        type: 'string',
        description: 'ID or short ID of a backup'
      },
      force: {
        type: 'boolean',
        description: 'Skip confirmation prompt'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      }
    },
    required: ['backupId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleBackupDeleteCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_backup_delete_cli = tool;