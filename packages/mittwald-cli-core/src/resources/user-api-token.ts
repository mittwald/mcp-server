/**
 * API token operations
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import { LibraryError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListUserApiTokensOptions extends LibraryFunctionBase {
  userId?: string;
}

export async function listUserApiTokens(options: ListUserApiTokensOptions): Promise<LibraryResult<any[]>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.user.listApiTokens({});
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

export interface GetUserApiTokenOptions extends LibraryFunctionBase {
  tokenId: string;
}

export async function getUserApiToken(options: GetUserApiTokenOptions): Promise<LibraryResult<any>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.user.getApiToken({ apiTokenId: options.tokenId });
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

export interface CreateUserApiTokenOptions extends LibraryFunctionBase {
  description: string;
  expiresAt?: string;
  roles?: string[];
}

export async function createUserApiToken(options: CreateUserApiTokenOptions): Promise<LibraryResult<any>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.user.createApiToken({
      data: {
        description: options.description,
        expiresAt: options.expiresAt,
        roles: (options.roles || []) as ["api_read" | "api_write", ...("api_read" | "api_write")[]],
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

export interface RevokeUserApiTokenOptions extends LibraryFunctionBase {
  tokenId: string;
}

export async function revokeUserApiToken(options: RevokeUserApiTokenOptions): Promise<LibraryResult<void>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.user.deleteApiToken({ apiTokenId: options.tokenId });
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
