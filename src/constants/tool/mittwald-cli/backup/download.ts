import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_backup_download: Tool = {
  name: "mittwald_backup_download",
  description: "Download a backup to your local disk",
  inputSchema: {
    type: "object",
    properties: {
      backupId: {
        type: "string",
        description: "ID or short ID of a backup"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      },
      format: {
        type: "string",
        enum: ["tar", "zip"],
        description: "The file format to download the backup in"
      },
      password: {
        type: "string",
        description: "The password to encrypt the backup with"
      },
      generatePassword: {
        type: "boolean",
        description: "Generate a random password to encrypt the backup with"
      },
      promptPassword: {
        type: "boolean",
        description: "Prompt for a password to encrypt the backup with"
      },
      output: {
        type: "string",
        description: "The file to write the backup to; if omitted, the filename will be determined by the server"
      },
      resume: {
        type: "boolean",
        description: "Resume a previously interrupted download"
      }
    },
    required: ["backupId"]
  }
};