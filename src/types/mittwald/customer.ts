/**
 * @file Type definitions for Mittwald Customer API
 * @module types/mittwald/customer
 */

import type { MittwaldAPIV2 } from '@mittwald/api-client';

// Re-export customer-related types from the API client
export type Customer = MittwaldAPIV2.Components.Schemas.CustomerCustomer;
export type CustomerInvite = MittwaldAPIV2.Components.Schemas.MembershipCustomerInvite;
export type CustomerMembership = MittwaldAPIV2.Components.Schemas.MembershipCustomerMembership;

// Tool-specific argument types
export interface ListCustomersArgs {
  limit?: number;
  skip?: number;
  page?: number;
}

export interface GetCustomerArgs {
  customerId: string;
}

export interface CreateCustomerArgs {
  email: string;
  company?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  title?: string;
  salutation?: string;
  country?: string;
}

export interface UpdateCustomerArgs {
  customerId: string;
  company?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  title?: string;
  salutation?: string;
  website?: string;
}

export interface DeleteCustomerArgs {
  customerId: string;
}

export interface CreateCustomerInviteArgs {
  customerId: string;
  addressId: string;
  mailAddress: string;
  message?: string;
  membershipRoles?: string[];
}

export interface ListCustomerInvitesArgs {
  customerId: string;
  limit?: number;
  skip?: number;
}

export interface AcceptCustomerInviteArgs {
  customerInviteId: string;
  invitationToken?: string;
}

export interface ListCustomerMembershipsArgs {
  customerId: string;
  limit?: number;
  skip?: number;
}

export interface UploadCustomerAvatarArgs {
  customerId: string;
}

export interface DeleteCustomerAvatarArgs {
  customerId: string;
}

export interface LeaveCustomerArgs {
  customerId: string;
}

export interface IsCustomerLegallyCompetentArgs {
  customerId: string;
}

export interface GetCustomerWalletArgs {
  customerId: string;
}

export interface CreateCustomerWalletArgs {
  customerId: string;
}

// Additional tool argument types
export interface ListCustomerContractsArgs {
  customerId: string;
  limit?: number;
  skip?: number;
}

export interface GetLeadFyndrContractArgs {
  customerId: string;
}

export interface GetConversationPreferencesArgs {
  customerId: string;
}

export interface GetExtensionInstanceArgs {
  customerId: string;
  extensionId: string;
}

export interface GetInvoiceSettingsArgs {
  customerId: string;
}

export interface UpdateInvoiceSettingsArgs {
  customerId: string;
  billingAddress?: object;
  paymentMethod?: string;
}

export interface ListInvoicesArgs {
  customerId: string;
  limit?: number;
  skip?: number;
}

export interface GetInvoiceArgs {
  customerId: string;
  invoiceId: string;
}

export interface GetInvoiceFileAccessTokenArgs {
  customerId: string;
  invoiceId: string;
}

export interface ListOrdersArgs {
  customerId: string;
  limit?: number;
  skip?: number;
}