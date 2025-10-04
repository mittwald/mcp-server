import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleBackupScheduleDeleteCli } from '../../../../handlers/tools/mittwald-cli/backup/schedule-delete-cli.js';

const tool: Tool = {
  name: 'mittwald_backup_schedule_delete',
  title: 'Delete Backup Schedule',
  description: 'Delete a backup schedule.',
  inputSchema: {
    type: 'object',
    properties: {
      backupScheduleId: {
        type: 'string',
        description: 'ID or short ID of a backup schedule'
      },
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone).'
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
    required: ['backupScheduleId', 'confirm']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleBackupScheduleDeleteCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_backup_schedule_delete_cli = tool;
