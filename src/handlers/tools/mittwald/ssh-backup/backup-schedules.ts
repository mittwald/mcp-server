/**
 * @file Handlers for Mittwald Backup Schedules API
 * @module handlers/tools/mittwald/ssh-backup/backup-schedules
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
import type {
  ListBackupSchedulesArgs,
  CreateBackupScheduleArgs,
  GetBackupScheduleArgs,
  UpdateBackupScheduleArgs,
  DeleteBackupScheduleArgs,
} from '../../../../types/mittwald/ssh-backup.js';

export async function handleListBackupSchedules(args: ListBackupSchedulesArgs) {
  try {
    const { projectId } = args;
    const client = getMittwaldClient();
    
    const response = await client.api.backup.listProjectBackupSchedules({ projectId });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved backup schedules",
      result: {
        backupSchedules: response.data || [],
        total: response.data?.length || 0,
        projectId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list backup schedules: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleCreateBackupSchedule(args: CreateBackupScheduleArgs) {
  try {
    const { projectId, description, schedule, ttl } = args;
    const client = getMittwaldClient();
    
    const requestBody: any = {
      schedule,
    };
    
    if (description) {
      requestBody.description = description;
    }
    
    if (ttl) {
      requestBody.ttl = ttl;
    }

    const response = await client.api.backup.createProjectBackupSchedule({ projectId, data: requestBody });

    if (response.status !== 201) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully created backup schedule",
      result: {
        backupSchedule: response.data,
        projectId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create backup schedule: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleGetBackupSchedule(args: GetBackupScheduleArgs) {
  try {
    const { projectBackupScheduleId } = args;
    const client = getMittwaldClient();
    
    const response = await client.api.backup.getProjectBackupSchedule({ projectBackupScheduleId });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved backup schedule",
      result: {
        backupSchedule: response.data,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get backup schedule: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleUpdateBackupSchedule(args: UpdateBackupScheduleArgs) {
  try {
    const { projectBackupScheduleId, description, schedule, ttl } = args;
    const client = getMittwaldClient();
    
    const requestBody: any = {};
    
    if (description !== undefined) {
      requestBody.description = description;
    }
    
    if (schedule !== undefined) {
      requestBody.schedule = schedule;
    }
    
    if (ttl !== undefined) {
      requestBody.ttl = ttl;
    }

    const response = await client.api.backup.updateProjectBackupSchedule(
      { projectBackupScheduleId, data: requestBody }
    );

    if (response.status !== 204) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully updated backup schedule",
      result: {
        updated: true,
        projectBackupScheduleId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update backup schedule: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleDeleteBackupSchedule(args: DeleteBackupScheduleArgs) {
  try {
    const { projectBackupScheduleId } = args;
    const client = getMittwaldClient();
    
    const response = await client.api.backup.deleteProjectBackupSchedule({ projectBackupScheduleId });

    if (response.status !== 204) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully deleted backup schedule",
      result: {
        deleted: true,
        projectBackupScheduleId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete backup schedule: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}