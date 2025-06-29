import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface BackupParameters {
  command: 'create' | 'delete' | 'download' | 'get' | 'list';
  // Common parameters
  projectId?: string;
  backupId?: string;
  // Create parameters
  description?: string;
  expirationTime?: string;
  wait?: boolean;
  waitTimeout?: number;
  // Download parameters
  output?: string;
  resume?: boolean;
  // List parameters
  outputFormat?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const mittwald_backup: Tool = {
  name: 'mittwald_backup',
  description: 'Manage backups of your projects - create, delete, download, get details, or list backups',
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        enum: ["create", "delete", "download", "get", "list"],
        description: "The backup command to execute"
      },
      // Common parameters
      projectId: {
        type: "string",
        description: "ID or short ID of a project; required for create and list commands"
      },
      backupId: {
        type: "string",
        description: "ID of a backup; required for delete, download, and get commands"
      },
      // Create parameters
      description: {
        type: "string",
        description: "Description for the backup (create command)"
      },
      expirationTime: {
        type: "string",
        description: "Expiration date for the backup in ISO format (create command)"
      },
      wait: {
        type: "boolean",
        description: "Wait for the backup to complete (create command)"
      },
      waitTimeout: {
        type: "number",
        description: "Timeout for wait operation in milliseconds (create command)"
      },
      // Download parameters
      output: {
        type: "string",
        description: "Output file path for backup download (download command)"
      },
      resume: {
        type: "boolean",
        description: "Resume a partial download (download command)"
      },
      // List parameters
      outputFormat: {
        type: "string",
        enum: ["txt", "json", "yaml", "csv", "tsv"],
        default: "json",
        description: "Output format for list command"
      },
      extended: {
        type: "boolean",
        description: "Show extended information (list and get commands)"
      },
      noHeader: {
        type: "boolean",
        description: "Hide table header (list command, only relevant for txt output)"
      },
      noTruncate: {
        type: "boolean",
        description: "Do not truncate output (list command, only relevant for txt output)"
      },
      noRelativeDates: {
        type: "boolean",
        description: "Show dates in absolute format, not relative (list command, only relevant for txt output)"
      },
      csvSeparator: {
        type: "string",
        enum: [",", ";"],
        default: ",",
        description: "Separator for CSV output (list command, only relevant for CSV output)"
      }
    },
    required: ["command"]
  }
};