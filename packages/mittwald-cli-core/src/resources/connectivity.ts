/**
 * Connectivity resource library functions
 *
 * These functions resolve the data an agent needs to connect to a hosting
 * environment from its own machine (SSH endpoints, phpMyAdmin URLs, backup
 * download URLs). The MCP server never opens interactive sessions, tunnels or
 * browsers itself — it hands the connection details to the agent instead.
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';
import { LibraryError } from '../contracts/functions.js';
import { getSSHConnectionForProject } from '../lib/resources/ssh/project.js';
import { getSSHConnectionForAppInstallation } from '../lib/resources/ssh/appinstall.js';

async function execute<T>(fn: (client: MittwaldAPIV2Client) => Promise<T>, apiToken: string): Promise<LibraryResult<T>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(apiToken);
    const data = await fn(client);

    return { data, status: 200, durationMs: performance.now() - startTime };
  } catch (error) {
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
  }
}

// ============================================================================
// SSH CONNECTION DATA
// ============================================================================

export interface SshConnectionInfo {
  /** SSH hostname to connect to */
  host: string;
  /** SSH username (`<mStudio user>@<short id>`) */
  user: string;
  /** Directory the connection is scoped to */
  directory: string;
}

export interface GetProjectSshConnectionOptions extends LibraryFunctionBase {
  projectId: string;
  sshUser?: string;
}

export interface ProjectSshConnectionInfo extends SshConnectionInfo {
  projectId: string;
  projectShortId: string;
}

export async function getProjectSshConnection(
  options: GetProjectSshConnectionOptions
): Promise<LibraryResult<ProjectSshConnectionInfo>> {
  return execute(async (client) => {
    const connection = await getSSHConnectionForProject(client, options.projectId, options.sshUser);
    const project = await client.project.getProject({ projectId: options.projectId });
    assertStatus(project, 200);

    return {
      ...connection,
      projectId: project.data.id,
      projectShortId: project.data.shortId,
    };
  }, options.apiToken);
}

export interface GetAppSshConnectionOptions extends LibraryFunctionBase {
  installationId: string;
  sshUser?: string;
}

export interface AppSshConnectionInfo extends SshConnectionInfo {
  installationId: string;
  appShortId: string;
}

export async function getAppSshConnection(
  options: GetAppSshConnectionOptions
): Promise<LibraryResult<AppSshConnectionInfo>> {
  return execute(async (client) => {
    const connection = await getSSHConnectionForAppInstallation(
      client,
      options.installationId,
      options.sshUser
    );

    return {
      host: connection.host,
      user: connection.user,
      directory: connection.directory,
      installationId: options.installationId,
      appShortId: connection.appShortId,
    };
  }, options.apiToken);
}

// ============================================================================
// MYSQL CONNECTION DATA
// ============================================================================

export interface MysqlConnectionInfo {
  databaseId: string;
  /** Name of the database (as used on the MySQL server) */
  database: string;
  /** Hostname of the MySQL server, resolvable from inside the hosting environment */
  hostname: string;
  /** Name of the database's main user */
  databaseUser: string;
  characterSet: string;
  projectId: string;
  projectShortId: string;
  /** SSH host to tunnel through / execute commands on */
  sshHost: string;
  /** SSH user to tunnel through / execute commands as */
  sshUser: string;
}

export interface GetMysqlConnectionOptions extends LibraryFunctionBase {
  databaseId: string;
  sshUser?: string;
}

export async function getMysqlConnection(
  options: GetMysqlConnectionOptions
): Promise<LibraryResult<MysqlConnectionInfo>> {
  return execute(async (client) => {
    const databaseResponse = await client.database.getMysqlDatabase({
      mysqlDatabaseId: options.databaseId,
    });
    assertStatus(databaseResponse, 200);
    const database = databaseResponse.data;

    const usersResponse = await client.database.listMysqlUsers({
      mysqlDatabaseId: options.databaseId,
    });
    assertStatus(usersResponse, 200);
    const mainUser = usersResponse.data.find((user) => user.mainUser);

    if (!mainUser) {
      throw new Error(`No main user found for MySQL database ${options.databaseId}`);
    }

    const projectResponse = await client.project.getProject({ projectId: database.projectId });
    assertStatus(projectResponse, 200);

    const sshConnection = await getSSHConnectionForProject(
      client,
      database.projectId,
      options.sshUser
    );

    return {
      databaseId: database.id,
      database: database.name,
      hostname: database.hostname,
      databaseUser: mainUser.name,
      characterSet: database.characterSettings.characterSet,
      projectId: database.projectId,
      projectShortId: projectResponse.data.shortId,
      sshHost: sshConnection.host,
      sshUser: sshConnection.user,
    };
  }, options.apiToken);
}

// ============================================================================
// PHPMYADMIN
// ============================================================================

export interface GetPhpMyAdminUrlOptions extends LibraryFunctionBase {
  databaseId: string;
}

export interface PhpMyAdminUrlInfo {
  url: string;
  databaseId: string;
  database: string;
  mysqlUserId: string;
  mysqlUser: string;
}

export async function getPhpMyAdminUrl(
  options: GetPhpMyAdminUrlOptions
): Promise<LibraryResult<PhpMyAdminUrlInfo>> {
  return execute(async (client) => {
    const databaseResponse = await client.database.getMysqlDatabase({
      mysqlDatabaseId: options.databaseId,
    });
    assertStatus(databaseResponse, 200);

    const usersResponse = await client.database.listMysqlUsers({
      mysqlDatabaseId: options.databaseId,
    });
    assertStatus(usersResponse, 200);
    const mainUser = usersResponse.data.find((user) => user.mainUser);

    if (!mainUser) {
      throw new Error(`No main user found for MySQL database ${options.databaseId}`);
    }

    const urlResponse = await client.database.getMysqlUserPhpMyAdminUrl({
      mysqlUserId: mainUser.id,
    });
    assertStatus(urlResponse, 200);

    return {
      url: urlResponse.data.url,
      databaseId: databaseResponse.data.id,
      database: databaseResponse.data.name,
      mysqlUserId: mainUser.id,
      mysqlUser: mainUser.name,
    };
  }, options.apiToken);
}

// ============================================================================
// BACKUP EXPORT / DOWNLOAD URL
// ============================================================================

export interface GetBackupDownloadUrlOptions extends LibraryFunctionBase {
  backupId: string;
  format?: 'tar' | 'zip';
  password?: string;
  /** Create a new export even if one already exists (e.g. to change the format) */
  recreate?: boolean;
}

export interface BackupDownloadUrlInfo {
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

export async function getBackupDownloadUrl(
  options: GetBackupDownloadUrlOptions
): Promise<LibraryResult<BackupDownloadUrlInfo>> {
  return execute(async (client) => {
    const backupResponse = await client.backup.getProjectBackup({
      projectBackupId: options.backupId,
    });
    assertStatus(backupResponse, 200);

    const format = options.format ?? 'tar';
    const currentExport = backupResponse.data.export;
    const formatMatches = currentExport?.format === format;
    const usable =
      currentExport && formatMatches && currentExport.phase !== 'Failed' && currentExport.phase !== 'Expired';

    if (usable && !options.recreate) {
      return {
        backupId: options.backupId,
        downloadURL: currentExport.downloadURL,
        format: currentExport.format,
        phase: currentExport.phase,
        expiresAt: currentExport.expiresAt,
        sha256Checksum: currentExport.sha256Checksum,
        withPassword: currentExport.withPassword,
        exportRequested: false,
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
      backupId: options.backupId,
      format,
      phase: 'Pending',
      withPassword: Boolean(options.password),
      exportRequested: true,
    };
  }, options.apiToken);
}
