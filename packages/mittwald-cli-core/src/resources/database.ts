/**
 * Database resource library functions
 * Wrappers for MySQL and Redis database operations
 */

import { randomBytes } from 'node:crypto';
import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';
import { libraryErrorFromApiError } from '../contracts/functions.js';
import { getSSHConnectionForProject } from '../lib/resources/ssh/project.js';

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

    const result: CreateMysqlDatabaseResult = {
      id: createResponse.data.id,
      userId: createResponse.data.userId,
      name: dbDetails.name,
      hostname: dbDetails.hostname,
      externalHostname: dbDetails.externalHostname,
      userName: dbDetails.mainUser?.name ?? '',
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

// ============================================================================
// MYSQL CONNECTION DATA
// ============================================================================

export interface GetMysqlConnectionOptions extends LibraryFunctionBase {
  databaseId: string;
  /** Override the SSH user; defaults to the authenticated mStudio user */
  sshUser?: string;
}

export interface MysqlConnection {
  databaseId: string;
  /** Name of the database on the MySQL server */
  database: string;
  /** Hostname of the MySQL server; only resolvable from inside the hosting environment */
  hostname: string;
  /** Name of the database's main user */
  databaseUser: string;
  characterSet: string;
  projectId: string;
  projectShortId: string;
  /** SSH host to tunnel through or execute commands on */
  sshHost: string;
  /** SSH user to tunnel through or execute commands as */
  sshUser: string;
}

/**
 * Resolves everything needed to reach a MySQL database from outside the hosting
 * environment: the database's own coordinates plus the SSH endpoint to tunnel through.
 *
 * The user's password is not part of this; the API cannot read it back.
 */
export async function getMysqlConnection(
  options: GetMysqlConnectionOptions
): Promise<LibraryResult<MysqlConnection>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

    const databaseResponse = await client.database.getMysqlDatabase({
      mysqlDatabaseId: options.databaseId,
    });
    assertStatus(databaseResponse, 200);
    const database = databaseResponse.data;

    const mainUser = await getMysqlMainUser(client, options.databaseId);

    const projectResponse = await client.project.getProject({ projectId: database.projectId });
    assertStatus(projectResponse, 200);

    const sshConnection = await getSSHConnectionForProject(
      client,
      database.projectId,
      options.sshUser
    );

    return {
      data: {
        databaseId: database.id,
        database: database.name,
        hostname: database.hostname,
        databaseUser: mainUser.name,
        characterSet: database.characterSettings.characterSet,
        projectId: database.projectId,
        projectShortId: projectResponse.data.shortId,
        sshHost: sshConnection.host,
        sshUser: sshConnection.user,
      },
      status: databaseResponse.status,
      durationMs: performance.now() - startTime,
    };
  } catch (error) {
    throw libraryErrorFromApiError(error, startTime);
  }
}

export interface GetPhpMyAdminUrlOptions extends LibraryFunctionBase {
  databaseId: string;
}

export interface PhpMyAdminUrl {
  url: string;
  databaseId: string;
  database: string;
  mysqlUserId: string;
  mysqlUser: string;
}

/**
 * Resolves the phpMyAdmin URL for a database's main user.
 *
 * The URL authenticates the user; treat it as a credential.
 */
export async function getPhpMyAdminUrl(
  options: GetPhpMyAdminUrlOptions
): Promise<LibraryResult<PhpMyAdminUrl>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

    const databaseResponse = await client.database.getMysqlDatabase({
      mysqlDatabaseId: options.databaseId,
    });
    assertStatus(databaseResponse, 200);

    const mainUser = await getMysqlMainUser(client, options.databaseId);

    const urlResponse = await client.database.getMysqlUserPhpMyAdminUrl({
      mysqlUserId: mainUser.id,
    });
    assertStatus(urlResponse, 200);

    return {
      data: {
        url: urlResponse.data.url,
        databaseId: databaseResponse.data.id,
        database: databaseResponse.data.name,
        mysqlUserId: mainUser.id,
        mysqlUser: mainUser.name,
      },
      status: urlResponse.status,
      durationMs: performance.now() - startTime,
    };
  } catch (error) {
    throw libraryErrorFromApiError(error, startTime);
  }
}

/**
 * Looks up a database's main user, which owns the database and is the one
 * phpMyAdmin and dump/import operations authenticate as.
 */
async function getMysqlMainUser(client: MittwaldAPIV2Client, databaseId: string) {
  const response = await client.database.listMysqlUsers({ mysqlDatabaseId: databaseId });
  assertStatus(response, 200);

  const mainUser = response.data.find((user) => user.mainUser);
  if (!mainUser) {
    throw new Error(`No main user found for MySQL database ${databaseId}`);
  }

  return mainUser;
}
