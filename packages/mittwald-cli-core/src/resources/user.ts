/**
 * User operations
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import { LibraryError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface GetUserOptions extends LibraryFunctionBase {
  userId?: string;
}

export async function getUser(options: GetUserOptions): Promise<LibraryResult<any>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const userId = options.userId || 'self';
    const response = await client.user.getUser({ userId });
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
