/**
 * Type definitions for Mittwald Project API
 */

// Project entity
export interface Project {
  id: string;
  customerId: string;
  description?: string;
  directories?: {
    Backup?: string;
    Web?: string;
    Logs?: string;
  };
  enabled: boolean;
  imageRefId?: string;
  isReady: boolean;
  projectHostingId?: string;
  readiness: string;
  serverId?: string;
  shortId: string;
  createdAt?: string;
}

// Project membership
export interface ProjectMembership {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  createdAt: string;
  memberSince: string;
  expiresAt?: string;
}

// Project roles
export type ProjectRole = 'owner' | 'member';

// Project invitation
export interface ProjectInvite {
  id: string;
  projectId: string;
  mailAddress: string;
  role: ProjectRole;
  createdAt: string;
  membershipExpiresAt?: string;
  messageCustomization?: {
    message?: string;
    language?: string;
  };
}

// Storage statistics
export interface StorageStatistics {
  totalMB: number;
  usedMB: number;
  availableMB: number;
  usedPercentage: number;
  partitions: Array<{
    name: string;
    totalMB: number;
    usedMB: number;
    availableMB: number;
    usedPercentage: number;
  }>;
}

// Storage notification threshold
export interface StorageNotificationThreshold {
  enabled: boolean;
  thresholdPercentage: number;
}

// Contract info
export interface ProjectContract {
  contractId: string;
  contractNumber?: string;
}

// Order
export interface Order {
  orderId: string;
  orderNumber: string;
  status: string;
  customerId: string;
  createdAt: string;
  items?: Array<{
    description: string;
    amount: number;
    price: number;
  }>;
}

// JWT token response
export interface ProjectJWT {
  jwt: string;
  expiresAt: string;
}

// List projects request parameters
export interface ListProjectsParams {
  customerId?: string;
  serverId?: string;
  limit?: number;
  skip?: number;
}

// Create/Update invitation parameters
export interface CreateProjectInviteParams {
  mailAddress: string;
  role: ProjectRole;
  membershipExpiresAt?: string;
  messageCustomization?: {
    message?: string;
    language?: string;
  };
}

// Update membership parameters
export interface UpdateProjectMembershipParams {
  expiresAt?: string;
  role?: string;
}

// Update storage threshold parameters
export interface UpdateStorageThresholdParams {
  enabled: boolean;
  thresholdPercentage: number;
}

// Avatar upload parameters
export interface UploadAvatarParams {
  file: Buffer | string;
  filename: string;
  contentType: string;
}