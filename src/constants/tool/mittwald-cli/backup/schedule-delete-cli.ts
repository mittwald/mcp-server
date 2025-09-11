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
      force: {
        type: 'boolean',
        description: 'Skip confirmation prompt'
      }
    },
    required: ['backupScheduleId']
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