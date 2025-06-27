/**
 * Container Registry management handlers
 * 
 * @module handlers/tools/mittwald/container/registry-management
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
import type { ToolHandler } from '../../types.js';
import type {
  CreateRegistryRequest,
  ListRegistriesRequest,
  UpdateRegistryRequest,
  ValidateRegistryUriRequest,
  ValidateRegistryCredentialsRequest,
} from '../../../../types/mittwald/container.js';
import { containerToolSuccessMessages } from '../../../../constants/tool/mittwald/container/index.js';

export const handleCreateRegistry: ToolHandler<CreateRegistryRequest & { username?: string; password?: string }> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const requestBody: any = {
      imageRegistryType: args.imageRegistryType,
      uri: args.uri,
    };
    
    if (args.username || args.password) {
      requestBody.credentials = {
        username: args.username,
        password: args.password,
      };
    }
    
    const response = await client.typedApi.container.createRegistry({
      projectId: args.projectId,
      data: {
        imageRegistryType: requestBody.imageRegistryType,
        registryUri: requestBody.uri,
        ...(requestBody.credentials && { credentials: requestBody.credentials })
      }
    });
    
    if (String(response.status).startsWith('2') && (response as any).data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.createRegistry,
        result: response.data,
      });
    }
    
    throw new Error(`Failed to create registry: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create container registry: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleListRegistries: ToolHandler<ListRegistriesRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const queryParams: any = {};
    if (args.limit) queryParams.limit = args.limit;
    if (args.skip) queryParams.skip = args.skip;
    if (args.page) queryParams.page = args.page;
    
    const response = await client.typedApi.container.listRegistries({
      projectId: args.projectId,
      queryParameters: queryParams
    });
    
    if (String(response.status).startsWith('2') && (response as any).data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.listRegistries,
        result: response.data,
      });
    }
    
    throw new Error(`Failed to list registries: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list container registries: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleGetRegistry: ToolHandler<{ registryId: string }> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.container.getRegistry({
      registryId: args.registryId
    });
    
    if (response.status === 200 && response.data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.getRegistry,
        result: response.data,
      });
    }
    
    throw new Error(`Failed to get registry: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get container registry: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleUpdateRegistry: ToolHandler<UpdateRegistryRequest & { username?: string; password?: string }> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const requestBody: any = {};
    if (args.imageRegistryType) requestBody.imageRegistryType = args.imageRegistryType;
    if (args.uri) requestBody.uri = args.uri;
    
    if (args.username || args.password) {
      requestBody.credentials = {
        username: args.username,
        password: args.password,
      };
    }
    
    const response = await client.typedApi.container.updateRegistry({
      registryId: args.registryId,
      data: {
        ...(requestBody.imageRegistryType && { imageRegistryType: requestBody.imageRegistryType }),
        ...(requestBody.uri && { registryUri: requestBody.uri }),
        ...(requestBody.credentials && { credentials: requestBody.credentials })
      }
    });
    
    if (String(response.status).startsWith('2') && (response as any).data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.updateRegistry,
        result: response.data,
      });
    }
    
    throw new Error(`Failed to update registry: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update container registry: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleDeleteRegistry: ToolHandler<{ registryId: string }> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.container.deleteRegistry({
      registryId: args.registryId
    });
    
    if (response.status === 204) {
      return formatToolResponse({
        message: containerToolSuccessMessages.deleteRegistry,
        result: { deleted: true, registryId: args.registryId },
      });
    }
    
    throw new Error(`Failed to delete registry: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete container registry: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleValidateRegistryUri: ToolHandler<ValidateRegistryUriRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.container.validateContainerRegistryUri({
      data: {
        registryUri: args.uri,
      },
    });
    
    if (response.status === 200 && response.data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.validateRegistryUri,
        result: response.data,
      });
    }
    
    throw new Error(`Failed to validate registry URI: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to validate registry URI: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleValidateRegistryCredentials: ToolHandler<ValidateRegistryCredentialsRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.container.validateRegistryCredentials({
      registryId: args.registryId,
    });
    
    if (response.status === 200 && response.data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.validateRegistryCredentials,
        result: response.data,
      });
    }
    
    throw new Error(`Failed to validate registry credentials: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to validate registry credentials: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};