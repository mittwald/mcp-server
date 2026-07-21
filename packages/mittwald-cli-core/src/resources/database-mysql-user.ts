/**
 * MySQL user operations
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import { libraryErrorFromApiError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListMysqlUsersOptions extends LibraryFunctionBase {
  databaseId: string;
}

export async function listMysqlUsers(options: ListMysqlUsersOptions): Promise<LibraryResult<any[]>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.database.listMysqlUsers({ mysqlDatabaseId: options.databaseId });
    assertStatus(response, 200);

    return { data: response.data, status: response.status, durationMs: performance.now() - startTime };
  } catch (error) {
    throw libraryErrorFromApiError(error, startTime);
  }
}

export interface GetMysqlUserOptions extends LibraryFunctionBase {
  userId: string;
}

export async function getMysqlUser(options: GetMysqlUserOptions): Promise<LibraryResult<any>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.database.getMysqlUser({ mysqlUserId: options.userId });
    assertStatus(response, 200);

    return { data: response.data, status: response.status, durationMs: performance.now() - startTime };
  } catch (error) {
    throw libraryErrorFromApiError(error, startTime);
  }
}

export interface CreateMysqlUserOptions extends LibraryFunctionBase {
  databaseId: string;
  accessLevel: 'full' | 'readonly';
  description: string;
  password: string;
  accessIpMask?: string;
  externalAccess?: boolean;
}

export async function createMysqlUser(options: CreateMysqlUserOptions): Promise<LibraryResult<any>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

    const data = {
      accessLevel: options.accessLevel,
      databaseId: options.databaseId,
      description: options.description,
      password: options.password,
      accessIpMask: options.accessIpMask,
      externalAccess: options.externalAccess,
    };

    const response = await client.database.createMysqlUser({
      mysqlDatabaseId: options.databaseId,
      data,
    });
    assertStatus(response, 201);

    return { data: response.data, status: response.status, durationMs: performance.now() - startTime };
  } catch (error) {
    throw libraryErrorFromApiError(error, startTime);
  }
}

export interface DeleteMysqlUserOptions extends LibraryFunctionBase {
  userId: string;
}

export async function deleteMysqlUser(options: DeleteMysqlUserOptions): Promise<LibraryResult<void>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.database.deleteMysqlUser({ mysqlUserId: options.userId });
    assertStatus(response, 204);

    return { data: undefined, status: response.status, durationMs: performance.now() - startTime };
  } catch (error) {
    throw libraryErrorFromApiError(error, startTime);
  }
}

export interface UpdateMysqlUserOptions extends LibraryFunctionBase {
  userId: string;
  description?: string;
  password?: string;
}

export async function updateMysqlUser(options: UpdateMysqlUserOptions): Promise<LibraryResult<void>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

    const data: any = {};
    if (options.description !== undefined) data.description = options.description;
    if (options.password !== undefined) data.password = options.password;

    const response = await client.database.updateMysqlUser({
      mysqlUserId: options.userId,
      data,
    });
    assertStatus(response, 204);

    return { data: undefined, status: response.status, durationMs: performance.now() - startTime };
  } catch (error) {
    throw libraryErrorFromApiError(error, startTime);
  }
}
