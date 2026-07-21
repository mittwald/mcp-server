/**
 * Extension operations
 */

import { executeApiCall } from './execute-api-call.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListExtensionsOptions extends LibraryFunctionBase {
  appId: string;
}

export async function listExtensions(options: ListExtensionsOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.marketplace.extensionListExtensions({}));
}

export interface ListInstalledExtensionsOptions extends LibraryFunctionBase {
  installationId: string;
}

export async function listInstalledExtensions(options: ListInstalledExtensionsOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.marketplace.extensionListExtensionInstances({}));
}

export interface InstallExtensionOptions extends LibraryFunctionBase {
  extensionId: string;
  context: 'project' | 'customer'; // MarketplaceContext
  contextId: string;
  consentedScopes: string[];
  variantKey?: string;
}

export async function installExtension(options: InstallExtensionOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.marketplace.extensionCreateExtensionInstance({
        data: {
          extensionId: options.extensionId,
          context: options.context,
          contextId: options.contextId,
          consentedScopes: options.consentedScopes,
          variantKey: options.variantKey
        },
      }),
    201
  );
}

export interface UninstallExtensionOptions extends LibraryFunctionBase {
  extensionInstanceId: string;
}

export async function uninstallExtension(options: UninstallExtensionOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.marketplace.extensionDeleteExtensionInstance({ extensionInstanceId: options.extensionInstanceId }), 204);
}
