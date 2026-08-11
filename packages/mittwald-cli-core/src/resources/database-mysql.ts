/**
 * MySQL database operations
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import { libraryErrorFromApiError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';
import { randomBytes } from 'node:crypto';
import { listMysqlUsers } from './database-mysql-user.js';

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

    // Right after creation, the freshly-created database's `mainUser` relation is often not yet
    // populated (eventual consistency on the API side). Fall back to a follow-up listMysqlUsers
    // call to resolve the real username instead of surfacing an empty string. Best-effort only:
    // if this also fails to find the user, fall back to '' as before rather than throwing.
    let userName = dbDetails.mainUser?.name ?? '';
    if (!userName) {
      try {
        const usersResponse = await listMysqlUsers({
          databaseId: createResponse.data.id,
          apiToken: options.apiToken,
        });
        const mainUser = usersResponse.data.find(
          (user) => user.id === createResponse.data.userId || user.mainUser === true
        );
        userName = mainUser?.name ?? '';
      } catch {
        // Best-effort enrichment — keep userName as '' if the follow-up lookup fails.
      }
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
