import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_backup_schedule_delete: Tool = {
  name: "mittwald_backup_schedule_delete",
  description: "Delete a backup schedule",
  inputSchema: {
    type: "object",
    properties: {
      backupScheduleId: {
        type: "string",
        description: "ID of schedule to delete"
      },
      force: {
        type: "boolean",
        description: "Do not ask for confirmation"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      }
    },
    required: ["backupScheduleId"]
  }
};