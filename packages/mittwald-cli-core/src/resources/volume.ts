/**
 * Container volume operations
 */

import { executeApiCall } from './execute-api-call.js';
import { LibraryError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListVolumesOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listVolumes(options: ListVolumesOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.container.listVolumes({ projectId: options.projectId }));
}

export interface CreateVolumeOptions extends LibraryFunctionBase {
  projectId: string;
  description: string;
  size: number;
}

export async function createVolume(options: CreateVolumeOptions): Promise<LibraryResult<any>> {
  // Note: createVolume does not exist in API - volumes are created via declareStack
  throw new LibraryError('createVolume not implemented - use declareStack to manage volumes', 501);
}

export interface DeleteVolumeOptions extends LibraryFunctionBase {
  volumeId: string;
  stackId: string; // Required by API
}

export async function deleteVolume(options: DeleteVolumeOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.container.deleteVolume({
    stackId: options.stackId,
    volumeId: options.volumeId
  }), 204);
}
