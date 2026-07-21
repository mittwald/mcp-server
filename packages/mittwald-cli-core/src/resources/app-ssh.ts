/**
 * SSH connection lookup for app installations
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { libraryErrorFromApiError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';
import { getSSHConnectionForAppInstallation } from '../lib/resources/ssh/appinstall.js';

export interface GetAppSshConnectionOptions extends LibraryFunctionBase {
  installationId: string;
  /** Override the SSH user; defaults to the authenticated mStudio user */
  sshUser?: string;
}

export interface AppSshConnection {
  /** SSH hostname of the project's cluster */
  host: string;
  /** SSH username (`<mStudio user>@<app short id>`) */
  user: string;
  /** The app installation's directory */
  directory: string;
  installationId: string;
  appShortId: string;
}

/**
 * Resolves the SSH connection data for an app installation.
 *
 * This only looks up the endpoint; establishing the connection is up to the caller.
 */
export async function getAppSshConnection(
  options: GetAppSshConnectionOptions
): Promise<LibraryResult<AppSshConnection>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const { host, user, directory, appShortId } = await getSSHConnectionForAppInstallation(
      client,
      options.installationId,
      options.sshUser
    );

    return {
      data: { host, user, directory, installationId: options.installationId, appShortId },
      status: 200,
      durationMs: performance.now() - startTime,
    };
  } catch (error) {
    throw libraryErrorFromApiError(error, startTime);
  }
}

// Add more app functions as needed...
// (dependencies, create, install variants, etc.)
