/**
 * Organization, membership and invite operations
 */

import { executeApiCall } from './execute-api-call.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListOrganizationsOptions extends LibraryFunctionBase {}

export async function listOrganizations(options: ListOrganizationsOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.customer.listCustomers());
}

export interface GetOrganizationOptions extends LibraryFunctionBase {
  customerId: string;
}

export async function getOrganization(options: GetOrganizationOptions): Promise<LibraryResult<any>> {
  return executeApiCall(options.apiToken, (client) => client.customer.getCustomer({ customerId: options.customerId }));
}

export interface DeleteOrganizationOptions extends LibraryFunctionBase {
  customerId: string;
}

export async function deleteOrganization(options: DeleteOrganizationOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.customer.deleteCustomer({ customerId: options.customerId }), 204);
}

// Organization memberships
export interface ListOrgMembershipsOptions extends LibraryFunctionBase {
  customerId: string;
}

export async function listOrgMemberships(options: ListOrgMembershipsOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.customer.listMembershipsForCustomer({ customerId: options.customerId }));
}

// Organization invites
export interface ListOrgInvitesOptions extends LibraryFunctionBase {
  customerId: string;
}

export async function listOrgInvites(options: ListOrgInvitesOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.customer.listInvitesForCustomer({ customerId: options.customerId }));
}

export interface InviteToOrgOptions extends LibraryFunctionBase {
  customerId: string;
  email: string;
  role: 'owner' | 'member' | 'accountant';
}

export async function inviteToOrg(options: InviteToOrgOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) => client.customer.createCustomerInvite({ customerId: options.customerId, data: { mailAddress: options.email, role: options.role } }),
    201
  );
}

export interface RevokeOrgInviteOptions extends LibraryFunctionBase {
  inviteId: string;
}

export async function revokeOrgInvite(options: RevokeOrgInviteOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.customer.deleteCustomerInvite({ customerInviteId: options.inviteId }), 204);
}

export interface RevokeOrgMembershipOptions extends LibraryFunctionBase {
  membershipId: string;
}

export async function revokeOrgMembership(options: RevokeOrgMembershipOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.customer.deleteCustomerMembership({ customerMembershipId: options.membershipId }), 204);
}
