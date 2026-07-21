/**
 * App catalogue lookups (available apps and their versions)
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import { LibraryError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

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
