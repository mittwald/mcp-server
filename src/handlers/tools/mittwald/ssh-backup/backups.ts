/**
 * @file Handlers for Mittwald Backup API
 * @module handlers/tools/mittwald/ssh-backup/backups
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
import type {
  ListBackupsArgs,
  CreateBackupArgs,
  GetBackupArgs,
  DeleteBackupArgs,
  UpdateBackupDescriptionArgs,
  CreateBackupExportArgs,
  DeleteBackupExportArgs,
} from '../../../../types/mittwald/ssh-backup.js';

export async function handleListBackups(args: ListBackupsArgs) {
  try {
    const { projectId, sort, limit, offset } = args;
    const client = getMittwaldClient();
    
    const queryParams: any = {};
    
    if (sort) {
      queryParams.sort = sort;
    }
    
    if (limit) {
      queryParams.limit = limit;
    }
    
    if (offset) {
      queryParams.offset = offset;
    }
    
    const response = await client.api.backup.listProjectBackups({ projectId, queryParameters: queryParams });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved project backups",
      result: {
        backups: response.data || [],
        total: response.data?.length || 0,
        projectId,
        sort,
        limit,
        offset,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list backups: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleCreateBackup(args: CreateBackupArgs) {
  try {
    const { projectId, description, expirationTime, ignoredSources } = args;
    const client = getMittwaldClient();
    
    const requestBody: any = {};
    
    if (description) {
      requestBody.description = description;
    }
    
    if (expirationTime) {
      requestBody.expirationTime = expirationTime;
    }
    
    if (ignoredSources) {
      requestBody.ignoredSources = ignoredSources;
    }

    const response = await client.api.backup.createProjectBackup({ projectId, data: requestBody });

    if (response.status !== 201) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully created project backup",
      result: {
        backup: response.data,
        projectId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create backup: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleGetBackup(args: GetBackupArgs) {
  try {
    const { projectBackupId } = args;
    const client = getMittwaldClient();
    
    const response = await client.api.backup.getProjectBackup({ projectBackupId });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved project backup",
      result: {
        backup: response.data,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get backup: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleDeleteBackup(args: DeleteBackupArgs) {
  try {
    const { projectBackupId } = args;
    const client = getMittwaldClient();
    
    const response = await client.api.backup.deleteProjectBackup({ projectBackupId });

    if (response.status !== 204) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully deleted project backup",
      result: {
        deleted: true,
        projectBackupId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete backup: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleUpdateBackupDescription(args: UpdateBackupDescriptionArgs) {
  try {
    const { projectBackupId, description } = args;
    const client = getMittwaldClient();
    
    const response = await client.api.backup.updateProjectBackupDescription(
      { projectBackupId, data: { description } }
    );

    if (response.status !== 204) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully updated backup description",
      result: {
        updated: true,
        projectBackupId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update backup description: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleCreateBackupExport(args: CreateBackupExportArgs) {
  try {
    const { projectBackupId, format, withPassword, password } = args;
    const client = getMittwaldClient();
    
    const requestBody: any = {};
    
    if (format) {
      requestBody.format = format;
    }
    
    if (withPassword !== undefined) {
      requestBody.withPassword = withPassword;
    }
    
    if (password) {
      requestBody.password = password;
    }

    const response = await client.api.backup.createProjectBackupExport(
      { projectBackupId, data: requestBody }
    );

    if (response.status !== 204) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully created backup export",
      result: {
        created: true,
        projectBackupId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create backup export: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleDeleteBackupExport(args: DeleteBackupExportArgs) {
  try {
    const { projectBackupId } = args;
    const client = getMittwaldClient();
    
    const response = await client.api.backup.deleteProjectBackupExport({ projectBackupId });

    if (response.status !== 204) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully deleted backup export",
      result: {
        deleted: true,
        projectBackupId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete backup export: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}