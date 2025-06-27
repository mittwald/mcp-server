/**
 * @file Tool definitions for Mittwald Backup Schedules API
 * @module constants/tool/mittwald/ssh-backup/backup-schedules
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldListBackupSchedules: Tool = {
  name: "mittwald_list_backup_schedules",
  description: "List all backup schedules for a specific project. Returns scheduled backups with their cron expressions and settings.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project",
      },
    },
    required: ["projectId"],
  },
};

export const mittwaldCreateBackupSchedule: Tool = {
  name: "mittwald_create_backup_schedule",
  description: "Create a new backup schedule for a project. The schedule uses crontab notation to define when backups are created.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project",
      },
      description: {
        type: "string",
        description: "Optional description for the backup schedule",
      },
      schedule: {
        type: "string",
        description: "Cron expression defining when backups should be created (e.g., '0 4 * * *' for daily at 4 AM)",
      },
      ttl: {
        type: "string",
        description: "Time-to-live for backups created by this schedule (e.g., '7d' for 7 days)",
      },
    },
    required: ["projectId", "schedule"],
  },
};

export const mittwaldGetBackupSchedule: Tool = {
  name: "mittwald_get_backup_schedule",
  description: "Get details of a specific backup schedule by its ID. Returns the schedule configuration and metadata.",
  inputSchema: {
    type: "object",
    properties: {
      projectBackupScheduleId: {
        type: "string",
        description: "The unique identifier of the backup schedule",
      },
    },
    required: ["projectBackupScheduleId"],
  },
};

export const mittwaldUpdateBackupSchedule: Tool = {
  name: "mittwald_update_backup_schedule",
  description: "Update an existing backup schedule's properties such as description, cron expression, or TTL.",
  inputSchema: {
    type: "object",
    properties: {
      projectBackupScheduleId: {
        type: "string",
        description: "The unique identifier of the backup schedule",
      },
      description: {
        type: "string",
        description: "New description for the backup schedule",
      },
      schedule: {
        type: "string",
        description: "New cron expression for the backup schedule",
      },
      ttl: {
        type: "string",
        description: "New time-to-live for backups created by this schedule",
      },
    },
    required: ["projectBackupScheduleId"],
  },
};

export const mittwaldDeleteBackupSchedule: Tool = {
  name: "mittwald_delete_backup_schedule",
  description: "Delete a backup schedule. This will stop automatic backup creation but won't affect existing backups.",
  inputSchema: {
    type: "object",
    properties: {
      projectBackupScheduleId: {
        type: "string",
        description: "The unique identifier of the backup schedule to delete",
      },
    },
    required: ["projectBackupScheduleId"],
  },
};