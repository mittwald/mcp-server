/**
 * @file Tool definitions for Mittwald Backup API
 * @module constants/tool/mittwald/ssh-backup/backups
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldListBackups: Tool = {
  name: "mittwald_list_backups",
  description: "List all backups for a specific project. Returns project backups with their status, creation dates, and metadata.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project",
      },
      sort: {
        type: "string",
        enum: ["oldestFirst", "newestFirst"],
        description: "Sort order for the backup list",
      },
      limit: {
        type: "number",
        description: "Maximum number of backups to return",
      },
      offset: {
        type: "number",
        description: "Number of backups to skip for pagination",
      },
    },
    required: ["projectId"],
  },
};

export const mittwaldCreateBackup: Tool = {
  name: "mittwald_create_backup",
  description: "Create a new backup for a project. The backup will include files and databases unless specifically excluded.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project",
      },
      description: {
        type: "string",
        description: "Optional description for the backup",
      },
      expirationTime: {
        type: "string",
        format: "date-time",
        description: "When the backup should expire (ISO 8601 format)",
      },
      ignoredSources: {
        type: "object",
        properties: {
          files: {
            type: "boolean",
            description: "Whether to exclude files from the backup",
          },
          databases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                kind: {
                  type: "string",
                  description: "Type of database (e.g., 'mysql', 'redis')",
                },
                name: {
                  type: "string",
                  description: "Name of the database to exclude",
                },
              },
              required: ["kind", "name"],
            },
            description: "Array of databases to exclude from the backup",
          },
        },
        required: ["files"],
        description: "Sources to exclude from the backup",
      },
    },
    required: ["projectId"],
  },
};

export const mittwaldGetBackup: Tool = {
  name: "mittwald_get_backup",
  description: "Get details of a specific backup by its ID. Returns backup status, creation date, and export information.",
  inputSchema: {
    type: "object",
    properties: {
      projectBackupId: {
        type: "string",
        description: "The unique identifier of the project backup",
      },
    },
    required: ["projectBackupId"],
  },
};

export const mittwaldDeleteBackup: Tool = {
  name: "mittwald_delete_backup",
  description: "Delete a backup. This will permanently remove the backup and any associated exports.",
  inputSchema: {
    type: "object",
    properties: {
      projectBackupId: {
        type: "string",
        description: "The unique identifier of the project backup to delete",
      },
    },
    required: ["projectBackupId"],
  },
};

export const mittwaldUpdateBackupDescription: Tool = {
  name: "mittwald_update_backup_description",
  description: "Update the description of an existing backup.",
  inputSchema: {
    type: "object",
    properties: {
      projectBackupId: {
        type: "string",
        description: "The unique identifier of the project backup",
      },
      description: {
        type: "string",
        description: "New description for the backup",
      },
    },
    required: ["projectBackupId", "description"],
  },
};

export const mittwaldCreateBackupExport: Tool = {
  name: "mittwald_create_backup_export",
  description: "Create an export for a backup, making it available for download. The export can be password-protected.",
  inputSchema: {
    type: "object",
    properties: {
      projectBackupId: {
        type: "string",
        description: "The unique identifier of the project backup",
      },
      format: {
        type: "string",
        description: "Export format (default: 'tar')",
      },
      withPassword: {
        type: "boolean",
        description: "Whether to password-protect the export",
      },
      password: {
        type: "string",
        description: "Password for the export (required if withPassword is true)",
      },
    },
    required: ["projectBackupId"],
  },
};

export const mittwaldDeleteBackupExport: Tool = {
  name: "mittwald_delete_backup_export",
  description: "Delete a backup export, removing the download link and cleaning up exported files.",
  inputSchema: {
    type: "object",
    properties: {
      projectBackupId: {
        type: "string",
        description: "The unique identifier of the project backup",
      },
    },
    required: ["projectBackupId"],
  },
};