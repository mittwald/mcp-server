/**
 * Container operations
 */

import { executeApiCall } from './execute-api-call.js';
import { LibraryError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListContainersOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listContainers(options: ListContainersOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.container.listServices({ projectId: options.projectId }));
}

export interface RestartContainerOptions extends LibraryFunctionBase {
  containerId: string;
}

export async function restartContainer(options: RestartContainerOptions): Promise<LibraryResult<void>> {
  // Note: Container operations map to Service operations in the API
  throw new LibraryError('restartContainer not implemented - needs stackId and serviceId mapping', 501);
}

export interface StartContainerOptions extends LibraryFunctionBase {
  containerId: string;
}

export async function startContainer(options: StartContainerOptions): Promise<LibraryResult<void>> {
  // Note: Container operations map to Service operations in the API
  throw new LibraryError('startContainer not implemented - needs stackId and serviceId mapping', 501);
}

export interface StopContainerOptions extends LibraryFunctionBase {
  containerId: string;
}

export async function stopContainer(options: StopContainerOptions): Promise<LibraryResult<void>> {
  // Note: Container operations map to Service operations in the API
  // containerId is used as both stackId and serviceId
  throw new LibraryError('stopContainer not implemented - needs stackId and serviceId mapping', 501);
}

export interface DeleteContainerOptions extends LibraryFunctionBase {
  containerId: string;
}

export async function deleteContainer(options: DeleteContainerOptions): Promise<LibraryResult<void>> {
  // Note: Container operations map to Service operations in the API
  throw new LibraryError('deleteContainer not implemented - needs stackId and serviceId mapping', 501);
}
