import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_backup_schedule_create: Tool = {
  name: "mittwald_backup_schedule_create",
  description: "Create a new backup schedule",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      },
      schedule: {
        type: "string",
        description: "Set the interval at which the backup should be scheduled (cron schedule expression)"
      },
      ttl: {
        type: "string",
        description: "Define the backup retention period in days for backups created (format: [amount]d, e.g. '7d')"
      },
      description: {
        type: "string",
        description: "Set the description for the backup schedule"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      }
    },
    required: ["schedule", "ttl"]
  }
};