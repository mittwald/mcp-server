import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import { LibraryFunctionBase, LibraryResult, LibraryError } from './contracts/functions.js';

// Re-export contracts for external use
export type { LibraryFunctionBase, LibraryResult } from './contracts/functions.js';
export { LibraryError } from './contracts/functions.js';

/**
 * Options for listApps function
 */
export interface ListAppsOptions extends LibraryFunctionBase {
  /** Project ID to list apps for */
  projectId: string;
}

/**
 * Single app installation result
 */
export interface AppInstallation {
  id: string;
  appId: string;
  name: string;
  version: string;
  status: string;
}

/**
 * Result type for listApps
 */
export interface AppListResult {
  installations: AppInstallation[];
}

/**
 * List all app installations for a given project
 * @param options - Options including apiToken and projectId
 * @returns Library result containing app installations
 */
export async function listApps(options: ListAppsOptions): Promise<LibraryResult<AppListResult>> {
  const startTime = performance.now();

  try {
    // Create API client with token
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

    // Call API
    const response = await client.app.listAppinstallations({
      projectId: options.projectId,
    });

    // Assert successful status
    assertStatus(response, 200);

    // Import lib helpers for enrichment
    const { getAppFromUuid } = await import('./lib/resources/app/uuid.js');

    // Enrich data using lib utilities
    const enrichedData = await Promise.all(
      response.data.map(async (item) => ({
        id: item.id,
        appId: item.appId,
        name: (await getAppFromUuid(client, item.appId)).name,
        version: item.appVersion?.desired || 'unknown',
        status: 'installed',
      }))
    );

    const durationMs = performance.now() - startTime;

    return {
      data: { installations: enrichedData },
      status: response.status,
      durationMs,
    };
  } catch (error) {
    const durationMs = performance.now() - startTime;

    if (error instanceof Error) {
      throw new LibraryError(
        error.message,
        (error as any).status || 500,
        { originalError: error, durationMs }
      );
    }

    throw new LibraryError(
      'Unknown error occurred',
      500,
      { originalError: error, durationMs }
    );
  }
}

/**
 * Options for listProjects function
 */
export interface ListProjectsOptions extends LibraryFunctionBase {
  /** Optional server ID to filter projects */
  serverId?: string;
}

/**
 * Single project result
 */
export interface Project {
  id: string;
  shortId: string;
  description: string;
  enabled: boolean;
  createdAt: string;
}

/**
 * Result type for listProjects
 */
export interface ProjectListResult {
  projects: Project[];
}

/**
 * List all projects
 * @param options - Options including apiToken
 * @returns Library result containing projects
 */
export async function listProjects(options: ListProjectsOptions): Promise<LibraryResult<ProjectListResult>> {
  const startTime = performance.now();

  try {
    // Create API client with token
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

    // Call API
    const response = await client.project.listProjects();

    // Assert successful status
    assertStatus(response, 200);

    // Map data
    const projects = response.data.map((item) => ({
      id: item.id,
      shortId: item.shortId,
      description: item.description,
      enabled: item.enabled,
      createdAt: item.createdAt,
    }));

    const durationMs = performance.now() - startTime;

    return {
      data: { projects },
      status: response.status,
      durationMs,
    };
  } catch (error) {
    const durationMs = performance.now() - startTime;

    if (error instanceof Error) {
      throw new LibraryError(
        error.message,
        (error as any).status || 500,
        { originalError: error, durationMs }
      );
    }

    throw new LibraryError(
      'Unknown error occurred',
      500,
      { originalError: error, durationMs }
    );
  }
}

/**
 * Options for listMysqlDatabases function
 */
export interface ListMysqlDatabasesOptions extends LibraryFunctionBase {
  /** Project ID to list databases for */
  projectId: string;
}

/**
 * Single MySQL database result
 */
export interface MysqlDatabase {
  id: string;
  name: string;
  version: string;
  charset: string;
  collation: string;
}

/**
 * Result type for listMysqlDatabases
 */
export interface MysqlDatabaseListResult {
  databases: MysqlDatabase[];
}

/**
 * List all MySQL databases for a given project
 * @param options - Options including apiToken and projectId
 * @returns Library result containing MySQL databases
 */
export async function listMysqlDatabases(options: ListMysqlDatabasesOptions): Promise<LibraryResult<MysqlDatabaseListResult>> {
  const startTime = performance.now();

  try {
    // Create API client with token
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

    // Call API
    const response = await client.database.listMysqlDatabases({
      projectId: options.projectId,
    });

    // Assert successful status
    assertStatus(response, 200);

    // Map data
    const databases = response.data.map((item) => ({
      id: item.id,
      name: item.name || 'unnamed',
      version: item.version || 'unknown',
      charset: item.characterSettings?.characterSet || 'utf8mb4',
      collation: item.characterSettings?.collation || 'utf8mb4_unicode_ci',
    }));

    const durationMs = performance.now() - startTime;

    return {
      data: { databases },
      status: response.status,
      durationMs,
    };
  } catch (error) {
    const durationMs = performance.now() - startTime;

    if (error instanceof Error) {
      throw new LibraryError(
        error.message,
        (error as any).status || 500,
        { originalError: error, durationMs }
      );
    }

    throw new LibraryError(
      'Unknown error occurred',
      500,
      { originalError: error, durationMs }
    );
  }
}
