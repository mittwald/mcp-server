import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_backup_delete: Tool = {
  name: "mittwald_backup_delete",
  description: "Delete a backup",
  inputSchema: {
    type: "object",
    properties: {
      backupId: {
        type: "string",
        description: "ID or short ID of a backup"
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
    required: ["backupId"]
  }
};