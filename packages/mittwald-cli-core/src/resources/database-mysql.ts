/**
 * MySQL database operations
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import { libraryErrorFromApiError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';
import { randomBytes } from 'node:crypto';
import { poll } from '../lib/poll.js';

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
    throw libraryErrorFromApiError(error, startTime);
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
    throw libraryErrorFromApiError(error, startTime);
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

const MYSQL_PASSWORD_ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const MYSQL_PASSWORD_SPECIAL_CHARS = '#!~%^*_+-=?{}()<>|.,;$:/';
const MYSQL_PASSWORD_ALL_CHARS = MYSQL_PASSWORD_ALPHANUMERIC + MYSQL_PASSWORD_SPECIAL_CHARS;
const MYSQL_PASSWORD_FORBIDDEN_START = '-_;';

function generateMySqlUserPassword(): string {
  // API requires: min 8 chars, at least one special char, cannot start with -_;
  // Generate 20 chars from 87-char alphabet, then fix up if needed
  const bytes = randomBytes(22); // extra bytes for fixup randomness
  const chars: string[] = [];

  for (let i = 0; i < 20; i++) {
    chars.push(MYSQL_PASSWORD_ALL_CHARS[bytes[i] % MYSQL_PASSWORD_ALL_CHARS.length]);
  }

  // Fix first char if it starts with forbidden character
  if (MYSQL_PASSWORD_FORBIDDEN_START.includes(chars[0])) {
    chars[0] = MYSQL_PASSWORD_ALPHANUMERIC[bytes[20] % MYSQL_PASSWORD_ALPHANUMERIC.length];
  }

  // Ensure at least one special char exists; if not, replace a random position (not first)
  if (!chars.some(c => MYSQL_PASSWORD_SPECIAL_CHARS.includes(c))) {
    const pos = 1 + (bytes[21] % 19);
    chars[pos] = MYSQL_PASSWORD_SPECIAL_CHARS[bytes[20] % MYSQL_PASSWORD_SPECIAL_CHARS.length];
  }

  return chars.join('');
}

// Right after `createMysqlDatabase` succeeds, `getMysqlDatabase` can briefly return the new
// database without its `mainUser` relation populated (eventual consistency on the API side).
// Poll the same endpoint a few more times, with exponential backoff, rather than surfacing an
// empty username. Bounded so a slow/never-converging backend can't hang the tool call: worst
// case is MYSQL_USERNAME_POLL_MAX_ATTEMPTS extra requests, with delays growing from
// MYSQL_USERNAME_POLL_INITIAL_DELAY_MS up to MYSQL_USERNAME_POLL_MAX_DELAY_MS between them.
const MYSQL_USERNAME_POLL_MAX_ATTEMPTS = 4;
const MYSQL_USERNAME_POLL_INITIAL_DELAY_MS = 100;
const MYSQL_USERNAME_POLL_MAX_DELAY_MS = 2000;

export interface CreateMysqlDatabaseResult {
  /** The database ID */
  id: string;
  /** The default user ID */
  userId: string;
  /** The database name (for connection strings) */
  name: string;
  /** The internal hostname */
  hostname: string;
  /** The external hostname (for remote connections) */
  externalHostname: string;
  /** The username for the default user */
  userName: string;
  /** The password (only present if auto-generated) */
  password?: string;
  /** Whether the password was auto-generated */
  passwordWasGenerated: boolean;
}

export async function createMysqlDatabase(options: CreateMysqlDatabaseOptions): Promise<LibraryResult<CreateMysqlDatabaseResult>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

    // Track if we're generating the password
    const passwordWasGenerated = !options.userPassword;
    const password = options.userPassword ?? generateMySqlUserPassword();

    const data = {
      database: {
        projectId: options.projectId,
        description: options.description,
        version: options.version,
        ...(options.characterSettings ? { characterSettings: options.characterSettings } : {}),
      },
      user: {
        accessLevel: options.userAccessLevel ?? 'full',
        password,
        ...(options.userAccessIpMask !== undefined
          ? { accessIpMask: options.userAccessIpMask }
          : {}),
        ...(options.userExternalAccess !== undefined
          ? { externalAccess: options.userExternalAccess }
          : {}),
      },
    };

    const createResponse = await client.database.createMysqlDatabase({
      projectId: options.projectId,
      data,
    });
    assertStatus(createResponse, 201);

    // Fetch full database details to get hostname, name, and user info
    const getResponse = await client.database.getMysqlDatabase({
      mysqlDatabaseId: createResponse.data.id,
    });
    assertStatus(getResponse, 200);

    const dbDetails = getResponse.data;

    // See the comment on MYSQL_USERNAME_POLL_MAX_ATTEMPTS above: poll getMysqlDatabase — the same
    // endpoint we just called — until mainUser.name shows up, rather than reading it once. A
    // fallback read from a different endpoint (e.g. listMysqlUsers) wouldn't help here: it reads
    // the same not-yet-converged backend state, so it can race the same way getMysqlDatabase did.
    // Best-effort only: if the budget is exhausted before the username appears, fall back to ''
    // as before rather than throwing (retryOnError so a transient error on one poll attempt
    // doesn't abort the remaining ones either).
    let userName = dbDetails.mainUser?.name ?? '';
    if (!userName) {
      userName =
        (await poll(
          async () => {
            const pollResponse = await client.database.getMysqlDatabase({
              mysqlDatabaseId: createResponse.data.id,
            });
            assertStatus(pollResponse, 200);
            return pollResponse.data.mainUser?.name ?? '';
          },
          (name) => Boolean(name),
          {
            maxAttempts: MYSQL_USERNAME_POLL_MAX_ATTEMPTS,
            initialDelayMs: MYSQL_USERNAME_POLL_INITIAL_DELAY_MS,
            maxDelayMs: MYSQL_USERNAME_POLL_MAX_DELAY_MS,
            retryOnError: true,
          }
        )) ?? '';
    }

    const result: CreateMysqlDatabaseResult = {
      id: createResponse.data.id,
      userId: createResponse.data.userId,
      name: dbDetails.name,
      hostname: dbDetails.hostname,
      externalHostname: dbDetails.externalHostname,
      userName,
      passwordWasGenerated,
      // Only include password if it was auto-generated (security: don't echo back user-provided passwords)
      ...(passwordWasGenerated ? { password } : {}),
    };

    return { data: result, status: createResponse.status, durationMs: performance.now() - startTime };
  } catch (error) {
    throw libraryErrorFromApiError(error, startTime);
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
    throw libraryErrorFromApiError(error, startTime);
  }
}
