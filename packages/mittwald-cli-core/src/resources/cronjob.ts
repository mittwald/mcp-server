/**
 * Cronjob and cronjob execution operations
 */

import { executeApiCall } from './execute-api-call.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListCronjobsOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listCronjobs(options: ListCronjobsOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.cronjob.listCronjobs({ projectId: options.projectId }));
}

export interface GetCronjobOptions extends LibraryFunctionBase {
  cronjobId: string;
}

export async function getCronjob(options: GetCronjobOptions): Promise<LibraryResult<any>> {
  return executeApiCall(options.apiToken, (client) => client.cronjob.getCronjob({ cronjobId: options.cronjobId }));
}

export interface CreateCronjobOptions extends LibraryFunctionBase {
  projectId: string;
  appId: string;
  description: string;
  interval: string;
  timeout: number;
  active?: boolean;
  email?: string;
  destination: { url: string } | { interpreter: string; path: string };
}

export async function createCronjob(options: CreateCronjobOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.cronjob.createCronjob({
        projectId: options.projectId,
        data: {
          appId: options.appId,
          description: options.description,
          interval: options.interval,
          timeout: options.timeout,
          active: options.active !== false,
          email: options.email,
          destination: options.destination,
        },
      }),
    201
  );
}

export interface UpdateCronjobOptions extends LibraryFunctionBase {
  cronjobId: string;
  description?: string;
  interval?: string;
  email?: string;
  destination?: { url: string } | { interpreter: string; path: string };
  timeout?: number;
  active?: boolean;
}

export async function updateCronjob(options: UpdateCronjobOptions): Promise<LibraryResult<void>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.cronjob.updateCronjob({
        cronjobId: options.cronjobId,
        data: {
          description: options.description,
          interval: options.interval,
          email: options.email,
          destination: options.destination,
          timeout: options.timeout,
          active: options.active,
        },
      }),
    204
  );
}

export interface DeleteCronjobOptions extends LibraryFunctionBase {
  cronjobId: string;
}

export async function deleteCronjob(options: DeleteCronjobOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.cronjob.deleteCronjob({ cronjobId: options.cronjobId }), 204);
}

export interface ExecuteCronjobOptions extends LibraryFunctionBase {
  cronjobId: string;
}

export async function executeCronjob(options: ExecuteCronjobOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) => client.cronjob.createExecution({ cronjobId: options.cronjobId }),
    201
  );
}

// Cronjob executions
export interface ListCronjobExecutionsOptions extends LibraryFunctionBase {
  cronjobId: string;
}

export async function listCronjobExecutions(options: ListCronjobExecutionsOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.cronjob.listExecutions({ cronjobId: options.cronjobId }));
}

export interface GetCronjobExecutionOptions extends LibraryFunctionBase {
  cronjobId: string;
  executionId: string;
}

export async function getCronjobExecution(options: GetCronjobExecutionOptions): Promise<LibraryResult<any>> {
  return executeApiCall(options.apiToken, (client) => client.cronjob.getExecution({ cronjobId: options.cronjobId, executionId: options.executionId }));
}

export interface AbortCronjobExecutionOptions extends LibraryFunctionBase {
  cronjobId: string;
  executionId: string;
}

export async function abortCronjobExecution(options: AbortCronjobExecutionOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.cronjob.abortExecution({ cronjobId: options.cronjobId, executionId: options.executionId }), 204);
}

// Continue with domain, container, backup, and other resources...
// (This file is getting large - additional resources would follow the same pattern)
