/**
 * App resource library functions
 * Comprehensive wrappers for all app operations
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';
import { LibraryError } from '../contracts/functions.js';

// ============================================================================
// LIST APPS
// ============================================================================

export interface ListAppsOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listApps(options: ListAppsOptions): Promise<LibraryResult<any[]>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.app.listAppinstallations({ projectId: options.projectId });
    assertStatus(response, 200);

    const { getAppFromUuid, getAppVersionFromUuid } = await import('../lib/resources/app/uuid.js');

    const enrichedData = await Promise.all(
      response.data.map(async (item) => ({
        ...item,
        app: await getAppFromUuid(client, item.appId),
        appVersionCurrent: item.appVersion.current
          ? await getAppVersionFromUuid(client, item.appId, item.appVersion.current)
          : undefined,
        appVersionDesired: await getAppVersionFromUuid(client, item.appId, item.appVersion.desired),
      }))
    );

    return { data: enrichedData, status: response.status, durationMs: performance.now() - startTime };
  } catch (error) {
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
  }
}

// ============================================================================
// GET APP
// ============================================================================

export interface GetAppOptions extends LibraryFunctionBase {
  installationId: string;
}

export async function getApp(options: GetAppOptions): Promise<LibraryResult<any>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.app.getAppinstallation({ appInstallationId: options.installationId });
    assertStatus(response, 200);

    const { getAppFromUuid, getAppVersionFromUuid } = await import('../lib/resources/app/uuid.js');

    const enriched = {
      ...response.data,
      app: await getAppFromUuid(client, response.data.appId),
      appVersionCurrent: response.data.appVersion.current
        ? await getAppVersionFromUuid(client, response.data.appId, response.data.appVersion.current)
        : undefined,
      appVersionDesired: await getAppVersionFromUuid(
        client,
        response.data.appId,
        response.data.appVersion.desired
      ),
    };

    return { data: enriched, status: response.status, durationMs: performance.now() - startTime };
  } catch (error) {
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
  }
}

// ============================================================================
// GET PROJECT ID FROM INSTALLATION
// ============================================================================

export interface GetProjectIdFromInstallationOptions extends LibraryFunctionBase {
  installationId: string;
}

/**
 * Derives the projectId from an app installationId.
 * Useful when handlers accept installationId but need projectId for API calls.
 */
export async function getProjectIdFromInstallation(
  options: GetProjectIdFromInstallationOptions
): Promise<LibraryResult<string>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.app.getAppinstallation({ appInstallationId: options.installationId });
    assertStatus(response, 200);

    const projectId = response.data.projectId;
    if (!projectId) {
      throw new LibraryError('No projectId found in app installation', 404);
    }

    return { data: projectId, status: response.status, durationMs: performance.now() - startTime };
  } catch (error) {
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
  }
}

// ============================================================================
// UNINSTALL APP
// ============================================================================

export interface UninstallAppOptions extends LibraryFunctionBase {
  installationId: string;
}

export async function uninstallApp(options: UninstallAppOptions): Promise<LibraryResult<void>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.app.uninstallAppinstallation({ appInstallationId: options.installationId });
    assertStatus(response, 204);

    return { data: undefined, status: response.status, durationMs: performance.now() - startTime };
  } catch (error) {
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
  }
}

// ============================================================================
// UPDATE APP
// ============================================================================

export interface UpdateAppOptions extends LibraryFunctionBase {
  installationId: string;
  description?: string;
  updatePolicy?: string;
}

export async function updateApp(options: UpdateAppOptions): Promise<LibraryResult<void>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

    const data: any = {};
    if (options.description !== undefined) data.description = options.description;
    if (options.updatePolicy !== undefined) data.updatePolicy = options.updatePolicy;

    const response = await client.app.patchAppinstallation({
      appInstallationId: options.installationId,
      data,
    });
    assertStatus(response, 204);

    return { data: undefined, status: response.status, durationMs: performance.now() - startTime };
  } catch (error) {
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
  }
}

// ============================================================================
// COPY APP
// ============================================================================

export interface CopyAppOptions extends LibraryFunctionBase {
  installationId: string;
  description?: string;
}

export async function copyApp(options: CopyAppOptions): Promise<LibraryResult<any>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

    const data: any = {};
    if (options.description) data.description = options.description;

    const response = await client.app.requestAppinstallationCopy({
      appInstallationId: options.installationId,
      data,
    });
    assertStatus(response, 201);

    return { data: response.data, status: response.status, durationMs: performance.now() - startTime };
  } catch (error) {
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
  }
}

// ============================================================================
// LIST ALL APPS (APP TYPES)
// ============================================================================

export interface ListAllAppsOptions extends LibraryFunctionBase {}

/**
 * Lists all available app types (PHP, Node.js, etc.) from the Mittwald catalog.
 */
export async function listAllApps(options: ListAllAppsOptions): Promise<LibraryResult<any[]>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.app.listApps();
    assertStatus(response, 200);

    return { data: response.data, status: response.status, durationMs: performance.now() - startTime };
  } catch (error) {
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
  }
}

// ============================================================================
// RESOLVE APP NAME TO UUID
// ============================================================================

export interface ResolveAppNameOptions extends LibraryFunctionBase {
  appName: string;
}

/**
 * Resolves an app name (e.g., "PHP", "Node.js") to its UUID.
 */
export async function resolveAppNameToUuid(options: ResolveAppNameOptions): Promise<LibraryResult<string>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const { getAppUuidFromAppName } = await import('../lib/resources/app/uuid.js');
    const appUuid = await getAppUuidFromAppName(client, options.appName);

    return { data: appUuid, status: 200, durationMs: performance.now() - startTime };
  } catch (error) {
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
  }
}

// ============================================================================
// APP VERSIONS
// ============================================================================

export interface GetAppVersionsOptions extends LibraryFunctionBase {
  appId: string;
  recommended?: boolean;
}

export async function getAppVersions(options: GetAppVersionsOptions): Promise<LibraryResult<any[]>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.app.listAppversions({ appId: options.appId });
    assertStatus(response, 200);

    return { data: response.data, status: response.status, durationMs: performance.now() - startTime };
  } catch (error) {
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
  }
}

// ============================================================================
// LIST UPGRADE CANDIDATES
// ============================================================================

export interface ListUpgradeCandidatesOptions extends LibraryFunctionBase {
  installationId: string;
}

export async function listUpgradeCandidates(options: ListUpgradeCandidatesOptions): Promise<LibraryResult<any[]>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.app.getAppinstallation({ appInstallationId: options.installationId });
    assertStatus(response, 200);

    // Get available versions for the app
    const versionsResponse = await client.app.listAppversions({ appId: response.data.appId });
    assertStatus(versionsResponse, 200);

    // Filter for upgrade candidates (versions newer than current)
    const currentVersion = response.data.appVersion.desired;
    const candidates = versionsResponse.data.filter((v: any) => v.id !== currentVersion);

    return { data: candidates, status: 200, durationMs: performance.now() - startTime };
  } catch (error) {
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
  }
}

// ============================================================================
// UPGRADE APP
// ============================================================================

export interface UpgradeAppOptions extends LibraryFunctionBase {
  installationId: string;
  targetVersion?: string;
}

export async function upgradeApp(options: UpgradeAppOptions): Promise<LibraryResult<void>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

    const data: any = {};
    if (options.targetVersion) data.appVersionId = options.targetVersion;

    const response = await client.app.patchAppinstallation({
      appInstallationId: options.installationId,
      data,
    });
    assertStatus(response, 204);

    return { data: undefined, status: response.status, durationMs: performance.now() - startTime };
  } catch (error) {
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
  }
}

// Add more app functions as needed...
// (download, upload, ssh, dependencies, create, install variants, etc.)
