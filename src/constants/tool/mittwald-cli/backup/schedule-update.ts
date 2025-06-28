import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface BackupScheduleUpdateParameters {
  backupScheduleId: string;
  description?: string;
  schedule?: string;
  ttl?: string;
  quiet?: boolean;
}

export const backupScheduleUpdateTool: Tool = {
  name: 'mittwald_backup_schedule_update',
  description: 'Update an existing backup schedule',
  inputSchema: {
    type: "object",
    properties: {
      backupScheduleId: {
        type: "string",
        description: "Define the backup schedule that is to be updated"
      },
      description: {
        type: "string",
        description: "Set the description for the backup schedule"
      },
      schedule: {
        type: "string",
        description: "Set the interval at which the backup should be scheduled (cron expression)"
      },
      ttl: {
        type: "string",
        description: "Define the backup retention period in days for backups created (format: [amount]d, e.g. 7d)"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      }
    },
    required: ["backupScheduleId"]
  }
};