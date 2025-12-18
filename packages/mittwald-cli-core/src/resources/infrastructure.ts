/**
 * Infrastructure resource library functions
 * Wrappers for domain, container, backup, volume, server, and other infrastructure operations
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';
import { LibraryError } from '../contracts/functions.js';

// Generic API call wrapper
async function executeApiCall<T = any>(
  apiToken: string,
  apiCall: (client: MittwaldAPIV2Client) => Promise<any>,
  expectedStatus: number = 200
): Promise<LibraryResult<T>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(apiToken);
    const response = await apiCall(client);
    assertStatus(response, expectedStatus);

    return {
      data: response.data,
      status: response.status,
      durationMs: performance.now() - startTime,
    };
  } catch (error) {
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs: performance.now() - startTime }
    );
  }
}

// ============================================================================
// DOMAIN OPERATIONS
// ============================================================================

export interface ListDomainsOptions extends LibraryFunctionBase {
  projectId?: string;
}

export async function listDomains(options: ListDomainsOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) =>
    options.projectId
      ? client.domain.listDomains({ projectId: options.projectId })
      : client.domain.listDomains({})
  );
}

export interface GetDomainOptions extends LibraryFunctionBase {
  domainId: string;
}

export async function getDomain(options: GetDomainOptions): Promise<LibraryResult<any>> {
  return executeApiCall(options.apiToken, (client) => client.domain.getDomain({ domainId: options.domainId }));
}

// Domain DNS zones
export interface ListDnsZonesOptions extends LibraryFunctionBase {
  domainId?: string;
}

export async function listDnsZones(options: ListDnsZonesOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) =>
    options.domainId
      ? client.domain.listDnsZones({ domainId: options.domainId })
      : client.domain.listDnsZones({})
  );
}

export interface GetDnsZoneOptions extends LibraryFunctionBase {
  dnsZoneId: string;
}

export async function getDnsZone(options: GetDnsZoneOptions): Promise<LibraryResult<any>> {
  return executeApiCall(options.apiToken, (client) => client.domain.getDnsZone({ dnsZoneId: options.dnsZoneId }));
}

export interface UpdateDnsZoneOptions extends LibraryFunctionBase {
  dnsZoneId: string;
  recordSet: any; // Complex DNS record structure
}

export async function updateDnsZone(options: UpdateDnsZoneOptions): Promise<LibraryResult<void>> {
  return executeApiCall(
    options.apiToken,
    (client) => client.domain.updateDnsZone({ dnsZoneId: options.dnsZoneId, data: { recordSet: options.recordSet } }),
    204
  );
}

// Virtual hosts
export interface ListVirtualHostsOptions extends LibraryFunctionBase {
  projectId?: string;
}

export async function listVirtualHosts(options: ListVirtualHostsOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) =>
    options.projectId
      ? client.domain.ingressListIngresses({ projectId: options.projectId })
      : client.domain.ingressListIngresses({})
  );
}

export interface GetVirtualHostOptions extends LibraryFunctionBase {
  ingressId: string;
}

export async function getVirtualHost(options: GetVirtualHostOptions): Promise<LibraryResult<any>> {
  return executeApiCall(options.apiToken, (client) => client.domain.ingressGetIngress({ ingressId: options.ingressId }));
}

export interface CreateVirtualHostOptions extends LibraryFunctionBase {
  hostname: string;
  paths: any[];
}

export async function createVirtualHost(options: CreateVirtualHostOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) => client.domain.ingressCreateIngress({ data: { hostname: options.hostname, paths: options.paths } }),
    201
  );
}

export interface DeleteVirtualHostOptions extends LibraryFunctionBase {
  ingressId: string;
}

export async function deleteVirtualHost(options: DeleteVirtualHostOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.domain.ingressDeleteIngress({ ingressId: options.ingressId }), 204);
}

// ============================================================================
// CONTAINER OPERATIONS
// ============================================================================

export interface ListContainersOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listContainers(options: ListContainersOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.container.listContainers({ projectId: options.projectId }));
}

export interface RestartContainerOptions extends LibraryFunctionBase {
  containerId: string;
}

export async function restartContainer(options: RestartContainerOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.container.restartContainer({ containerId: options.containerId }), 204);
}

export interface StartContainerOptions extends LibraryFunctionBase {
  containerId: string;
}

export async function startContainer(options: StartContainerOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.container.startContainer({ containerId: options.containerId }), 204);
}

export interface StopContainerOptions extends LibraryFunctionBase {
  containerId: string;
}

export async function stopContainer(options: StopContainerOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.container.stopContainer({ containerId: options.containerId }), 204);
}

export interface DeleteContainerOptions extends LibraryFunctionBase {
  containerId: string;
}

export async function deleteContainer(options: DeleteContainerOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.container.deleteContainer({ containerId: options.containerId }), 204);
}

// ============================================================================
// BACKUP OPERATIONS
// ============================================================================

export interface ListBackupsOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listBackups(options: ListBackupsOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.backup.listProjectBackups({ projectId: options.projectId }));
}

export interface GetBackupOptions extends LibraryFunctionBase {
  backupId: string;
}

export async function getBackup(options: GetBackupOptions): Promise<LibraryResult<any>> {
  return executeApiCall(options.apiToken, (client) => client.backup.getProjectBackup({ projectBackupId: options.backupId }));
}

export interface CreateBackupOptions extends LibraryFunctionBase {
  projectId: string;
  description?: string;
}

export async function createBackup(options: CreateBackupOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) => client.backup.createProjectBackup({ projectId: options.projectId, data: { description: options.description } }),
    201
  );
}

export interface DeleteBackupOptions extends LibraryFunctionBase {
  backupId: string;
}

export async function deleteBackup(options: DeleteBackupOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.backup.deleteProjectBackup({ projectBackupId: options.backupId }), 204);
}

// Backup schedules
export interface ListBackupSchedulesOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listBackupSchedules(options: ListBackupSchedulesOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.backup.listProjectBackupSchedules({ projectId: options.projectId }));
}

export interface CreateBackupScheduleOptions extends LibraryFunctionBase {
  projectId: string;
  ttl: string;
  schedule: string;
  description?: string;
}

export async function createBackupSchedule(options: CreateBackupScheduleOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.backup.createProjectBackupSchedule({
        projectId: options.projectId,
        data: { ttl: options.ttl, schedule: options.schedule, description: options.description },
      }),
    201
  );
}

export interface UpdateBackupScheduleOptions extends LibraryFunctionBase {
  scheduleId: string;
  ttl?: string;
  schedule?: string;
  description?: string;
}

export async function updateBackupSchedule(options: UpdateBackupScheduleOptions): Promise<LibraryResult<void>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.backup.updateProjectBackupSchedule({
        projectBackupScheduleId: options.scheduleId,
        data: { ttl: options.ttl, schedule: options.schedule, description: options.description },
      }),
    204
  );
}

export interface DeleteBackupScheduleOptions extends LibraryFunctionBase {
  scheduleId: string;
}

export async function deleteBackupSchedule(options: DeleteBackupScheduleOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.backup.deleteProjectBackupSchedule({ projectBackupScheduleId: options.scheduleId }), 204);
}

// ============================================================================
// VOLUME OPERATIONS
// ============================================================================

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
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.container.createVolume({
        projectId: options.projectId,
        data: { description: options.description, size: options.size },
      }),
    201
  );
}

export interface DeleteVolumeOptions extends LibraryFunctionBase {
  volumeId: string;
}

export async function deleteVolume(options: DeleteVolumeOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.container.deleteVolume({ volumeId: options.volumeId }), 204);
}

// ============================================================================
// SERVER OPERATIONS
// ============================================================================

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

// ============================================================================
// SSH USER OPERATIONS
// ============================================================================

export interface ListSshUsersOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listSshUsers(options: ListSshUsersOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.user.listSshsfus({ projectId: options.projectId }));
}

export interface CreateSshUserOptions extends LibraryFunctionBase {
  projectId: string;
  description: string;
  publicKeys?: string[];
}

export async function createSshUser(options: CreateSshUserOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.user.createSshusfUser({
        projectId: options.projectId,
        data: { description: options.description, publicKeys: options.publicKeys },
      }),
    201
  );
}

export interface DeleteSshUserOptions extends LibraryFunctionBase {
  sshUserId: string;
}

export async function deleteSshUser(options: DeleteSshUserOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.user.deleteSshuser({ sshuserId: options.sshUserId }), 204);
}

export interface UpdateSshUserOptions extends LibraryFunctionBase {
  sshUserId: string;
  description?: string;
  active?: boolean;
}

export async function updateSshUser(options: UpdateSshUserOptions): Promise<LibraryResult<void>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.user.updateSshuserAuthenticationPublicKeys({
        sshuserId: options.sshUserId,
        data: { publicKeys: [] }, // TODO: Add proper public keys handling
      }),
    204
  );
}

// ============================================================================
// SFTP USER OPERATIONS (Similar to SSH)
// ============================================================================

export interface ListSftpUsersOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listSftpUsers(options: ListSftpUsersOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.user.listSftpusers({ projectId: options.projectId }));
}

export interface CreateSftpUserOptions extends LibraryFunctionBase {
  projectId: string;
  description: string;
  password: string;
}

export async function createSftpUser(options: CreateSftpUserOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.user.createSftpUser({
        projectId: options.projectId,
        data: { description: options.description, password: options.password },
      }),
    201
  );
}

export interface DeleteSftpUserOptions extends LibraryFunctionBase {
  sftpUserId: string;
}

export async function deleteSftpUser(options: DeleteSftpUserOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.user.deleteSftpUser({ sftpUserId: options.sftpUserId }), 204);
}

export interface UpdateSftpUserOptions extends LibraryFunctionBase {
  sftpUserId: string;
  description?: string;
  password?: string;
  active?: boolean;
}

export async function updateSftpUser(options: UpdateSftpUserOptions): Promise<LibraryResult<void>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.user.updateSftpUserAuthentication({
        sftpUserId: options.sftpUserId,
        data: { password: options.password },
      }),
    204
  );
}

// ============================================================================
// REGISTRY OPERATIONS
// ============================================================================

export interface ListRegistriesOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listRegistries(options: ListRegistriesOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.container.listRegistries({ projectId: options.projectId }));
}

export interface CreateRegistryOptions extends LibraryFunctionBase {
  projectId: string;
  description: string;
}

export async function createRegistry(options: CreateRegistryOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) => client.container.createRegistry({ projectId: options.projectId, data: { description: options.description } }),
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

// ============================================================================
// EXTENSION OPERATIONS
// ============================================================================

export interface ListExtensionsOptions extends LibraryFunctionBase {
  appId: string;
}

export async function listExtensions(options: ListExtensionsOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.app.listAppextensions({ appId: options.appId }));
}

export interface ListInstalledExtensionsOptions extends LibraryFunctionBase {
  installationId: string;
}

export async function listInstalledExtensions(options: ListInstalledExtensionsOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.app.listExtensionInstances({ appInstallationId: options.installationId }));
}

export interface InstallExtensionOptions extends LibraryFunctionBase {
  installationId: string;
  extensionId: string;
}

export async function installExtension(options: InstallExtensionOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.app.installExtension({
        appInstallationId: options.installationId,
        data: { extensionId: options.extensionId },
      }),
    201
  );
}

export interface UninstallExtensionOptions extends LibraryFunctionBase {
  extensionInstanceId: string;
}

export async function uninstallExtension(options: UninstallExtensionOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.app.uninstallExtension({ extensionInstanceId: options.extensionInstanceId }), 204);
}

// ============================================================================
// CERTIFICATE OPERATIONS
// ============================================================================

export interface ListCertificatesOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listCertificates(options: ListCertificatesOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.domain.listCertificates({ projectId: options.projectId }));
}

export interface RequestCertificateOptions extends LibraryFunctionBase {
  ingressId: string;
}

export async function requestCertificate(options: RequestCertificateOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) => client.domain.createCertificateRequest({ ingressId: options.ingressId }),
    201
  );
}

// ============================================================================
// CONVERSATION OPERATIONS
// ============================================================================

export interface ListConversationsOptions extends LibraryFunctionBase {}

export async function listConversations(options: ListConversationsOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.conversation.listConversations({}));
}

export interface GetConversationOptions extends LibraryFunctionBase {
  conversationId: string;
}

export async function getConversation(options: GetConversationOptions): Promise<LibraryResult<any>> {
  return executeApiCall(options.apiToken, (client) => client.conversation.getConversation({ conversationId: options.conversationId }));
}

export interface CreateConversationOptions extends LibraryFunctionBase {
  title: string;
  message: string;
  categoryId: string;
}

export async function createConversation(options: CreateConversationOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.conversation.createConversation({
        data: { title: options.title, messageContent: options.message, categoryId: options.categoryId },
      }),
    201
  );
}

export interface ReplyToConversationOptions extends LibraryFunctionBase {
  conversationId: string;
  message: string;
}

export async function replyToConversation(options: ReplyToConversationOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.conversation.createMessage({
        conversationId: options.conversationId,
        data: { messageContent: options.message },
      }),
    201
  );
}

export interface CloseConversationOptions extends LibraryFunctionBase {
  conversationId: string;
}

export async function closeConversation(options: CloseConversationOptions): Promise<LibraryResult<void>> {
  return executeApiCall(
    options.apiToken,
    (client) => client.conversation.updateConversationStatus({ conversationId: options.conversationId, data: { status: 'closed' } }),
    204
  );
}

export interface ListConversationCategoriesOptions extends LibraryFunctionBase {}

export async function listConversationCategories(options: ListConversationCategoriesOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.conversation.listCategories());
}

// ============================================================================
// STACK OPERATIONS
// ============================================================================

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
  return executeApiCall(options.apiToken, (client) => client.container.deleteStack({ stackId: options.stackId }), 204);
}
