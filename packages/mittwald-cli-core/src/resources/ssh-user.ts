/**
 * SSH user operations
 */

import { executeApiCall } from './execute-api-call.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListSshUsersOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listSshUsers(options: ListSshUsersOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.sshsftpUser.sshUserListSshUsers({ projectId: options.projectId }));
}

export interface CreateSshUserOptions extends LibraryFunctionBase {
  projectId: string;
  description: string;
  publicKeys?: Array<{ key: string; comment: string }>;
}

export async function createSshUser(options: CreateSshUserOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.sshsftpUser.sshUserCreateSshUser({
        projectId: options.projectId,
        data: {
          description: options.description,
          authentication: { publicKeys: options.publicKeys || [] }
        },
      }),
    201
  );
}

export interface DeleteSshUserOptions extends LibraryFunctionBase {
  sshUserId: string;
}

export async function deleteSshUser(options: DeleteSshUserOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.sshsftpUser.sshUserDeleteSshUser({ sshUserId: options.sshUserId }), 204);
}

export interface UpdateSshUserOptions extends LibraryFunctionBase {
  sshUserId: string;
  description?: string;
  active?: boolean;
}

export async function updateSshUser(options: UpdateSshUserOptions): Promise<LibraryResult<void>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.sshsftpUser.sshUserUpdateSshUser({
        sshUserId: options.sshUserId,
        data: { description: options.description, active: options.active },
      }),
    204
  );
}
