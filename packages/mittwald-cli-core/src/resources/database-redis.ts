/**
 * Redis database operations
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import { libraryErrorFromApiError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

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
    throw libraryErrorFromApiError(error, startTime);
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
    throw libraryErrorFromApiError(error, startTime);
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
    throw libraryErrorFromApiError(error, startTime);
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
    throw libraryErrorFromApiError(error, startTime);
  }
}
