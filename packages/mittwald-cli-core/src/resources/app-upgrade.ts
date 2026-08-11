/**
 * App upgrade operations
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import { libraryErrorFromApiError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

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
    throw libraryErrorFromApiError(error, startTime);
  }
}

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
    throw libraryErrorFromApiError(error, startTime);
  }
}
