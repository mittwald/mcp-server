/**
 * Project backup and backup schedule operations
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import { executeApiCall } from './execute-api-call.js';
import { libraryErrorFromApiError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListBackupsOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listBackups(options: ListBackupsOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.backup.listProjectBackups({ projectId: options.projectId }));
}

export interface GetBackupOptions extends LibraryFunctionBase {
  backupId: string;
}

export async function getBackup(options: GetBackupOptions): Promise<LibraryResult<any>> {
  return executeApiCall(options.apiToken, (client) => client.backup.getProjectBackup({ projectBackupId: options.backupId }));
}

export interface CreateBackupOptions extends LibraryFunctionBase {
  projectId: string;
  description?: string;
}

export async function createBackup(options: CreateBackupOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) => client.backup.createProjectBackup({
      projectId: options.projectId,
      data: {
        description: options.description,
        expirationTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Default: 30 days
      }
    }),
    201
  );
}

export interface DeleteBackupOptions extends LibraryFunctionBase {
  backupId: string;
}

export async function deleteBackup(options: DeleteBackupOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.backup.deleteProjectBackup({ projectBackupId: options.backupId }), 204);
}

export interface GetBackupDownloadUrlOptions extends LibraryFunctionBase {
  backupId: string;
  /** Archive format; only applied when a new export is created (default: tar) */
  format?: 'tar' | 'zip';
  /** Password to protect the archive with; only applied when a new export is created */
  password?: string;
  /** Request a new export even if a usable one already exists */
  recreate?: boolean;
}

export interface BackupDownloadUrl {
  backupId: string;
  /** Set once the export has finished; undefined while it is still being prepared */
  downloadURL?: string;
  format?: string;
  phase?: string;
  expiresAt?: string;
  sha256Checksum?: string;
  withPassword?: boolean;
  /** True when this call triggered a new export */
  exportRequested: boolean;
}

/**
 * Returns the download URL of a backup's export, requesting a new export when none
 * usable exists.
 *
 * Exports are prepared asynchronously, so a freshly requested one has no URL yet;
 * callers poll by calling this again.
 */
export async function getBackupDownloadUrl(
  options: GetBackupDownloadUrlOptions
): Promise<LibraryResult<BackupDownloadUrl>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

    const backupResponse = await client.backup.getProjectBackup({ projectBackupId: options.backupId });
    assertStatus(backupResponse, 200);

    const format = options.format ?? 'tar';
    const existing = backupResponse.data.export;
    const usable =
      existing &&
      existing.format === format &&
      existing.phase !== 'Failed' &&
      existing.phase !== 'Expired';

    if (usable && !options.recreate) {
      return {
        data: {
          backupId: options.backupId,
          downloadURL: existing.downloadURL,
          format: existing.format,
          phase: existing.phase,
          expiresAt: existing.expiresAt,
          sha256Checksum: existing.sha256Checksum,
          withPassword: existing.withPassword,
          exportRequested: false,
        },
        status: backupResponse.status,
        durationMs: performance.now() - startTime,
      };
    }

    const exportResponse = await client.backup.createProjectBackupExport({
      projectBackupId: options.backupId,
      data: {
        format,
        ...(options.password ? { password: options.password } : {}),
      },
    });
    assertStatus(exportResponse, 204);

    return {
      data: {
        backupId: options.backupId,
        format,
        phase: 'Pending',
        withPassword: Boolean(options.password),
        exportRequested: true,
      },
      status: exportResponse.status,
      durationMs: performance.now() - startTime,
    };
  } catch (error) {
    throw libraryErrorFromApiError(error, startTime);
  }
}

// Backup schedules
export interface ListBackupSchedulesOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listBackupSchedules(options: ListBackupSchedulesOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.backup.listProjectBackupSchedules({ projectId: options.projectId }));
}

export interface CreateBackupScheduleOptions extends LibraryFunctionBase {
  projectId: string;
  ttl: string;
  schedule: string;
  description?: string;
}

export async function createBackupSchedule(options: CreateBackupScheduleOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.backup.createProjectBackupSchedule({
        projectId: options.projectId,
        data: { ttl: options.ttl, schedule: options.schedule, description: options.description },
      }),
    201
  );
}

export interface UpdateBackupScheduleOptions extends LibraryFunctionBase {
  scheduleId: string;
  ttl?: string;
  schedule?: string;
  description?: string;
}

export async function updateBackupSchedule(options: UpdateBackupScheduleOptions): Promise<LibraryResult<void>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.backup.updateProjectBackupSchedule({
        projectBackupScheduleId: options.scheduleId,
        data: { ttl: options.ttl, schedule: options.schedule, description: options.description },
      }),
    204
  );
}

export interface DeleteBackupScheduleOptions extends LibraryFunctionBase {
  scheduleId: string;
}

export async function deleteBackupSchedule(options: DeleteBackupScheduleOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.backup.deleteProjectBackupSchedule({ projectBackupScheduleId: options.scheduleId }), 204);
}
