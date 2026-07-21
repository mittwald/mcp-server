/**
 * Container stack operations
 */

import { MittwaldAPIV2 } from '@mittwald/api-client';
import { executeApiCall } from './execute-api-call.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

// Re-export API types for stack declarations
export type ContainerServiceDeclareRequest = MittwaldAPIV2.Components.Schemas.ContainerServiceDeclareRequest;
export type ContainerVolumeDeclareRequest = MittwaldAPIV2.Components.Schemas.ContainerVolumeDeclareRequest;

export interface ListStacksOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listStacks(options: ListStacksOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.container.listStacks({ projectId: options.projectId }));
}

export interface DeleteStackOptions extends LibraryFunctionBase {
  stackId: string;
}

export async function deleteStack(options: DeleteStackOptions): Promise<LibraryResult<void>> {
  // Note: Mittwald API uses declareStack with empty services/volumes to delete
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.container.declareStack({
        stackId: options.stackId,
        data: { services: {}, volumes: {} },
      }),
    204
  );
}

export interface DeployStackOptions extends LibraryFunctionBase {
  stackId: string;
  recreate?: boolean;
}

export async function deployStack(options: DeployStackOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.container.updateStack({
        stackId: options.stackId,
        data: {},
        queryParameters: { recreate: options.recreate ?? true },
      }),
    200
  );
}

export interface GetStackProcessesOptions extends LibraryFunctionBase {
  stackId: string;
  projectId: string;
}

export async function getStackProcesses(options: GetStackProcessesOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) =>
    client.container.listServices({
      projectId: options.projectId,
      queryParameters: { stackId: options.stackId },
    })
  );
}

export interface DeclareStackOptions extends LibraryFunctionBase {
  stackId: string;
  services: Record<string, ContainerServiceDeclareRequest>;
  volumes: Record<string, ContainerVolumeDeclareRequest>;
}

export async function declareStack(options: DeclareStackOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.container.declareStack({
        stackId: options.stackId,
        data: {
          services: options.services,
          volumes: options.volumes,
        },
      }),
    200
  );
}
