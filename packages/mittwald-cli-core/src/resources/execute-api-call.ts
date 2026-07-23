/**
 * Shared API call wrapper used by the resource modules.
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import type { LibraryResult } from '../contracts/functions.js';
import { LibraryError } from '../contracts/functions.js';

/**
 * Runs an API call with a token-scoped client, asserts the expected status and
 * wraps the result (and any failure) in the library's result/error types.
 */
export async function executeApiCall<T = any>(
  apiToken: string,
  apiCall: (client: MittwaldAPIV2Client) => Promise<any>,
  expectedStatus: number = 200
): Promise<LibraryResult<T>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(apiToken);
    const response = await apiCall(client);
    assertStatus(response, expectedStatus);

    return {
      data: response.data,
      status: response.status,
      durationMs: performance.now() - startTime,
    };
  } catch (error) {
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
  }
}
