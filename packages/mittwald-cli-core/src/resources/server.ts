/**
 * Server operations
 */

import { executeApiCall } from './execute-api-call.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListServersOptions extends LibraryFunctionBase {}

export async function listServers(options: ListServersOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.project.listServers());
}

export interface GetServerOptions extends LibraryFunctionBase {
  serverId: string;
}

export async function getServer(options: GetServerOptions): Promise<LibraryResult<any>> {
  return executeApiCall(options.apiToken, (client) => client.project.getServer({ serverId: options.serverId }));
}
