/**
 * SFTP user operations
 */

import { executeApiCall } from './execute-api-call.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListSftpUsersOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listSftpUsers(options: ListSftpUsersOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.sshsftpUser.sftpUserListSftpUsers({ projectId: options.projectId }));
}

export interface CreateSftpUserOptions extends LibraryFunctionBase {
  projectId: string;
  description: string;
  password: string;
  directories: [string, ...string[]]; // Required by API
  accessLevel?: 'read' | 'full';
}

export async function createSftpUser(options: CreateSftpUserOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.sshsftpUser.sftpUserCreateSftpUser({
        projectId: options.projectId,
        data: {
          description: options.description,
          authentication: { password: options.password },
          directories: options.directories,
          accessLevel: options.accessLevel
        },
      }),
    201
  );
}

export interface DeleteSftpUserOptions extends LibraryFunctionBase {
  sftpUserId: string;
}

export async function deleteSftpUser(options: DeleteSftpUserOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.sshsftpUser.sftpUserDeleteSftpUser({ sftpUserId: options.sftpUserId }), 204);
}

export interface UpdateSftpUserOptions extends LibraryFunctionBase {
  sftpUserId: string;
  description?: string;
  password?: string;
  active?: boolean;
}

export async function updateSftpUser(options: UpdateSftpUserOptions): Promise<LibraryResult<void>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.sshsftpUser.sftpUserUpdateSftpUser({
        sftpUserId: options.sftpUserId,
        data: { description: options.description, password: options.password, active: options.active },
      }),
    204
  );
}
