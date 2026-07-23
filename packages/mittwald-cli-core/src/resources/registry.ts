/**
 * Container registry operations
 */

import { executeApiCall } from './execute-api-call.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListRegistriesOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listRegistries(options: ListRegistriesOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.container.listRegistries({ projectId: options.projectId }));
}

export interface CreateRegistryOptions extends LibraryFunctionBase {
  projectId: string;
  description: string;
  uri: string; // Required by API
}

export async function createRegistry(options: CreateRegistryOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) => client.container.createRegistry({
      projectId: options.projectId,
      data: {
        description: options.description,
        uri: options.uri
      }
    }),
    201
  );
}

export interface DeleteRegistryOptions extends LibraryFunctionBase {
  registryId: string;
}

export async function deleteRegistry(options: DeleteRegistryOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.container.deleteRegistry({ registryId: options.registryId }), 204);
}

export interface UpdateRegistryOptions extends LibraryFunctionBase {
  registryId: string;
  description: string;
}

export async function updateRegistry(options: UpdateRegistryOptions): Promise<LibraryResult<void>> {
  return executeApiCall(
    options.apiToken,
    (client) => client.container.updateRegistry({ registryId: options.registryId, data: { description: options.description } }),
    204
  );
}
