/**
 * Type definitions for Mittwald Container API
 * 
 * @module types/mittwald/container
 */

import type { MittwaldAPIV2 } from '@mittwald/api-client';

// Re-export types from the Mittwald API client
export type Registry = MittwaldAPIV2.Components.Schemas.ContainerRegistry;
export type StackResponse = MittwaldAPIV2.Components.Schemas.ContainerStackResponse;
export type ServiceResponse = MittwaldAPIV2.Components.Schemas.ContainerServiceResponse;
export type VolumeResponse = MittwaldAPIV2.Components.Schemas.ContainerVolumeResponse;

// Request/Response types for registries
export interface CreateRegistryRequest {
  projectId: string;
  registry: {
    imageRegistryType: 'docker' | 'github' | 'gitlab' | string;
    uri: string;
    credentials?: {
      username?: string;
      password?: string;
    };
  };
}

export interface ListRegistriesRequest {
  projectId: string;
  limit?: number;
  skip?: number;
  page?: number;
}

export interface UpdateRegistryRequest {
  registryId: string;
  registry: {
    imageRegistryType?: 'docker' | 'github' | 'gitlab' | string;
    uri?: string;
    credentials?: {
      username?: string;
      password?: string;
    };
  };
}

// Request/Response types for stacks
export interface GetStackRequest {
  stackId: string;
}

export interface ListStacksRequest {
  projectId: string;
  limit?: number;
  skip?: number;
  page?: number;
}

export interface UpdateStackRequest {
  stackId: string;
  requestBody: {
    services?: Array<{
      name: string;
      imageURI?: string;
      environment?: Record<string, string>;
      ports?: Array<{
        containerPort: number;
        protocol?: 'tcp' | 'udp';
      }>;
      volumes?: Array<{
        name: string;
        mountPath: string;
        readOnly?: boolean;
      }>;
    }>;
    volumes?: Array<{
      name: string;
      size?: string;
    }>;
  };
}

export interface DeclareStackRequest {
  stackId: string;
  requestBody: {
    desiredServices?: Array<{
      name: string;
      imageURI: string;
      environment?: Record<string, string>;
      ports?: Array<{
        containerPort: number;
        protocol?: 'tcp' | 'udp';
      }>;
      volumes?: Array<{
        name: string;
        mountPath: string;
        readOnly?: boolean;
      }>;
    }>;
    desiredVolumes?: Array<{
      name: string;
      size?: string;
    }>;
  };
}

// Request/Response types for services
export interface GetServiceRequest {
  stackId: string;
  serviceId: string;
}

export interface ListServicesRequest {
  projectId: string;
  limit?: number;
  skip?: number;
  page?: number;
}

export interface GetServiceLogsRequest {
  stackId: string;
  serviceId: string;
  since?: string;
  until?: string;
  limit?: number;
}

// Request/Response types for volumes
export interface GetVolumeRequest {
  stackId: string;
  volumeId: string;
}

export interface ListVolumesRequest {
  projectId: string;
  limit?: number;
  skip?: number;
  page?: number;
}

export interface DeleteVolumeRequest {
  stackId: string;
  volumeId: string;
}

// Validation request types
export interface ValidateRegistryUriRequest {
  uri: string;
}

export interface ValidateRegistryCredentialsRequest {
  registryId: string;
}

// Service action types
export interface ServiceActionRequest {
  stackId: string;
  serviceId: string;
}