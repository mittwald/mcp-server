/**
 * Domain, DNS zone and virtual host operations
 */

import { executeApiCall } from './execute-api-call.js';
import { LibraryError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListDomainsOptions extends LibraryFunctionBase {
  projectId?: string;
}

export async function listDomains(options: ListDomainsOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) =>
    options.projectId
      ? client.domain.listDomains({ queryParameters: { projectId: options.projectId } })
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
  projectId?: string;
}

export async function listDnsZones(options: ListDnsZonesOptions): Promise<LibraryResult<any[]>> {
  if (!options.projectId) {
    throw new LibraryError('projectId is required for listDnsZones', 400);
  }
  return executeApiCall(options.apiToken, (client) =>
    client.domain.dnsListDnsZones({ projectId: options.projectId })
  );
}

export interface GetDnsZoneOptions extends LibraryFunctionBase {
  dnsZoneId: string;
}

export async function getDnsZone(options: GetDnsZoneOptions): Promise<LibraryResult<any>> {
  return executeApiCall(options.apiToken, (client) => client.domain.dnsGetDnsZone({ dnsZoneId: options.dnsZoneId }));
}

export interface UpdateDnsZoneOptions extends LibraryFunctionBase {
  dnsZoneId: string;
  recordSetType: 'a' | 'mx' | 'txt' | 'srv' | 'cname' | 'caa';
  recordSet: any; // Complex DNS record structure
}

export async function updateDnsZone(options: UpdateDnsZoneOptions): Promise<LibraryResult<void>> {
  return executeApiCall(
    options.apiToken,
    (client) => client.domain.dnsUpdateRecordSet({
      dnsZoneId: options.dnsZoneId,
      recordSet: options.recordSetType,
      data: {
        records: options.recordSet,
        settings: { ttl: { auto: true } }
      }
    }),
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
      ? client.domain.ingressListIngresses({ queryParameters: { projectId: options.projectId } })
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
  projectId: string; // Required by API
}

export async function createVirtualHost(options: CreateVirtualHostOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) => client.domain.ingressCreateIngress({ data: { hostname: options.hostname, paths: options.paths, projectId: options.projectId } }),
    201
  );
}

export interface DeleteVirtualHostOptions extends LibraryFunctionBase {
  ingressId: string;
}

export async function deleteVirtualHost(options: DeleteVirtualHostOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.domain.ingressDeleteIngress({ ingressId: options.ingressId }), 204);
}
