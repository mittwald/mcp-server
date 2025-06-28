import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_backup_get: Tool = {
  name: "mittwald_backup_get",
  description: "Show details of a backup",
  inputSchema: {
    type: "object",
    properties: {
      backupId: {
        type: "string",
        description: "ID or short ID of a backup"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        description: "Output in a more machine friendly format"
      }
    },
    required: ["backupId", "output"]
  }
};