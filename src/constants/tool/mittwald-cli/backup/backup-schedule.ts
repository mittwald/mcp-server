import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface BackupScheduleParameters {
  command: 'create' | 'delete';
  // Common parameters
  projectId?: string;
  backupScheduleId?: string;
  // Create parameters
  description?: string;
  schedule?: string;
  ttl?: string;
  // Common flags
  wait?: boolean;
  waitTimeout?: number;
  quiet?: boolean;
}

export const mittwald_backup_schedule: Tool = {
  name: 'mittwald_backup_schedule',
  description: 'Manage backup schedules of your projects - create or delete backup schedules',
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        enum: ["create", "delete"],
        description: "The backup schedule command to execute"
      },
      // Common parameters
      projectId: {
        type: "string",
        description: "ID or short ID of a project; optional if a default project is set in the context"
      },
      backupScheduleId: {
        type: "string",
        description: "ID of a backup schedule; required for delete command"
      },
      // Create parameters
      description: {
        type: "string",
        description: "Description for the backup schedule (create command)"
      },
      schedule: {
        type: "string",
        description: "Schedule interval as cron expression (create command)"
      },
      ttl: {
        type: "string",
        description: "Backup retention period in days, format: [amount]d, e.g. 7d (create command)"
      },
      // Common flags
      wait: {
        type: "boolean",
        description: "Wait for operation to complete"
      },
      waitTimeout: {
        type: "number",
        description: "Timeout for wait operation in milliseconds"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      }
    },
    required: ["command"]
  }
};