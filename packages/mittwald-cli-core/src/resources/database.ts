/**
 * Database resource library functions
 * Wrappers for MySQL and Redis database operations
 */

import { randomBytes } from 'node:crypto';
import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';
import { LibraryError } from '../contracts/functions.js';

// ============================================================================
// MYSQL DATABASES
// ============================================================================

export interface ListMysqlDatabasesOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listMysqlDatabases(options: ListMysqlDatabasesOptions): Promise<LibraryResult<any[]>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.database.listMysqlDatabases({ projectId: options.projectId });
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

export interface GetMysqlDatabaseOptions extends LibraryFunctionBase {
  databaseId: string;
}

export async function getMysqlDatabase(options: GetMysqlDatabaseOptions): Promise<LibraryResult<any>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.database.getMysqlDatabase({ mysqlDatabaseId: options.databaseId });
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

export interface CreateMysqlDatabaseOptions extends LibraryFunctionBase {
  projectId: string;
  description: string;
  version: string;
  characterSettings?: {
    characterSet: string;
    collation: string;
  };
  userPassword?: string;
  userAccessLevel?: 'full' | 'readonly';
  userAccessIpMask?: string;
  userExternalAccess?: boolean;
}

function generateMySqlUserPassword(): string {
  return randomBytes(16).toString('hex');
}

export async function createMysqlDatabase(options: CreateMysqlDatabaseOptions): Promise<LibraryResult<any>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const data = {
      database: {
        projectId: options.projectId,
        description: options.description,
        version: options.version,
        ...(options.characterSettings ? { characterSettings: options.characterSettings } : {}),
      },
      user: {
        accessLevel: options.userAccessLevel ?? 'full',
        password: options.userPassword ?? generateMySqlUserPassword(),
        ...(options.userAccessIpMask !== undefined
          ? { accessIpMask: options.userAccessIpMask }
          : {}),
        ...(options.userExternalAccess !== undefined
          ? { externalAccess: options.userExternalAccess }
          : {}),
      },
    };

    const response = await client.database.createMysqlDatabase({
      projectId: options.projectId,
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

export interface DeleteMysqlDatabaseOptions extends LibraryFunctionBase {
  databaseId: string;
}

export async function deleteMysqlDatabase(options: DeleteMysqlDatabaseOptions): Promise<LibraryResult<void>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.database.deleteMysqlDatabase({ mysqlDatabaseId: options.databaseId });
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
// MYSQL USERS
// ============================================================================

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
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
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
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
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
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
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
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
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
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
  }
}

// ============================================================================
// REDIS DATABASES
// ============================================================================

export interface ListRedisDatabasesOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listRedisDatabases(options: ListRedisDatabasesOptions): Promise<LibraryResult<any[]>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.database.listRedisDatabases({ projectId: options.projectId });
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

export interface GetRedisDatabaseOptions extends LibraryFunctionBase {
  databaseId: string;
}

export async function getRedisDatabase(options: GetRedisDatabaseOptions): Promise<LibraryResult<any>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.database.getRedisDatabase({ redisDatabaseId: options.databaseId });
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

export interface CreateRedisDatabaseOptions extends LibraryFunctionBase {
  projectId: string;
  description: string;
  version: string;
}

export async function createRedisDatabase(options: CreateRedisDatabaseOptions): Promise<LibraryResult<any>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

    const data = {
      description: options.description,
      version: options.version,
    };

    const response = await client.database.createRedisDatabase({
      projectId: options.projectId,
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

// Add versions functions
export interface GetDatabaseVersionsOptions extends LibraryFunctionBase {
  type: 'mysql' | 'redis';
}

export async function getDatabaseVersions(options: GetDatabaseVersionsOptions): Promise<LibraryResult<any[]>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

    const response =
      options.type === 'mysql'
        ? await client.database.listMysqlVersions()
        : await client.database.listRedisVersions();

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
