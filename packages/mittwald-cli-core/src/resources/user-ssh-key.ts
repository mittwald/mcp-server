/**
 * User SSH key operations
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import { LibraryError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListUserSshKeysOptions extends LibraryFunctionBase {
  userId?: string;
}

export async function listUserSshKeys(options: ListUserSshKeysOptions): Promise<LibraryResult<any>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.user.listSshKeys({});
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

export interface GetUserSshKeyOptions extends LibraryFunctionBase {
  sshKeyId: string;
}

export async function getUserSshKey(options: GetUserSshKeyOptions): Promise<LibraryResult<any>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.user.getSshKey({ sshKeyId: options.sshKeyId });
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

export interface CreateUserSshKeyOptions extends LibraryFunctionBase {
  publicKey: string;
  comment?: string;
  expiresAt?: string;
}

export async function createUserSshKey(options: CreateUserSshKeyOptions): Promise<LibraryResult<any>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.user.createSshKey({
      data: {
        publicKey: options.publicKey,
        expiresAt: options.expiresAt,
      },
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

export interface DeleteUserSshKeyOptions extends LibraryFunctionBase {
  sshKeyId: string;
}

export async function deleteUserSshKey(options: DeleteUserSshKeyOptions): Promise<LibraryResult<void>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.user.deleteSshKey({ sshKeyId: options.sshKeyId });
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
