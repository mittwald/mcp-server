/**
 * Lookups for reaching a MySQL database from outside the hosting environment
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import { libraryErrorFromApiError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';
import { getSSHConnectionForProject } from '../lib/resources/ssh/project.js';

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
