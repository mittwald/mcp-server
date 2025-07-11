import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleBackupScheduleUpdateCli } from '../../../../handlers/tools/mittwald-cli/backup/schedule-update-cli.js';

const tool: Tool = {
  name: 'mittwald_backup_schedule_update',
  description: 'Update a backup schedule using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      backupScheduleId: {
        type: 'string',
        description: 'ID or short ID of a backup schedule'
      },
      description: {
        type: 'string',
        description: 'Description for the backup schedule'
      },
      schedule: {
        type: 'string',
        description: 'Cron expression for the backup schedule'
      },
      ttl: {
        type: 'string',
        description: 'Time-to-live for backups (7d - 400d)'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      }
    },
    required: ['backupScheduleId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleBackupScheduleUpdateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_backup_schedule_update_cli = tool;