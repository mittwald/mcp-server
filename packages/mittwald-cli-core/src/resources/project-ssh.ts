/**
 * SSH connection lookup for projects
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import { libraryErrorFromApiError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';
import { getSSHConnectionForProject } from '../lib/resources/ssh/project.js';

export interface GetProjectSshConnectionOptions extends LibraryFunctionBase {
  projectId: string;
  /** Override the SSH user; defaults to the authenticated mStudio user */
  sshUser?: string;
}

export interface ProjectSshConnection {
  /** SSH hostname of the project's cluster */
  host: string;
  /** SSH username (`<mStudio user>@<project short id>`) */
  user: string;
  /** The project's web root */
  directory: string;
  projectId: string;
  projectShortId: string;
}

/**
 * Resolves the SSH connection data for a project.
 *
 * This only looks up the endpoint; establishing the connection is up to the caller.
 */
export async function getProjectSshConnection(
  options: GetProjectSshConnectionOptions
): Promise<LibraryResult<ProjectSshConnection>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.project.getProject({ projectId: options.projectId });
    assertStatus(response, 200);

    const connection = await getSSHConnectionForProject(client, options.projectId, options.sshUser);

    return {
      data: {
        ...connection,
        projectId: response.data.id,
        projectShortId: response.data.shortId,
      },
      status: response.status,
      durationMs: performance.now() - startTime,
    };
  } catch (error) {
    throw libraryErrorFromApiError(error, startTime);
  }
}
