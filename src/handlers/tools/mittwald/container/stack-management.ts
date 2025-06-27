/**
 * Container Stack management handlers
 * 
 * @module handlers/tools/mittwald/container/stack-management
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
import type { ToolHandler } from '../../types.js';
import type {
  GetStackRequest,
  ListStacksRequest,
  UpdateStackRequest,
  DeclareStackRequest,
} from '../../../../types/mittwald/container.js';
import { containerToolSuccessMessages } from '../../../../constants/tool/mittwald/container/index.js';

export const handleListStacks: ToolHandler<ListStacksRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const queryParams: any = {};
    if (args.limit) queryParams.limit = args.limit;
    if (args.skip) queryParams.skip = args.skip;
    if (args.page) queryParams.page = args.page;
    
    const response = await client.typedApi.container.listStacks({
      projectId: args.projectId,
      queryParameters: queryParams,
    });
    
    if (String(response.status).startsWith('2') && (response as any).data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.listStacks,
        result: (response as any).data,
      });
    }
    
    throw new Error(`Failed to list stacks: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list container stacks: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleGetStack: ToolHandler<GetStackRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.container.getStack({
      stackId: args.stackId,
    });
    
    if (String(response.status).startsWith('2') && (response as any).data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.getStack,
        result: (response as any).data,
      });
    }
    
    throw new Error(`Failed to get stack: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get container stack: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleUpdateStack: ToolHandler<UpdateStackRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const requestBody: any = {};
    if (args.services) requestBody.services = args.services;
    if (args.volumes) requestBody.volumes = args.volumes;
    
    const response = await client.typedApi.container.updateStack({
      stackId: args.stackId,
      data: requestBody,
    });
    
    if (String(response.status).startsWith('2') && (response as any).data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.updateStack,
        result: (response as any).data,
      });
    }
    
    throw new Error(`Failed to update stack: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update container stack: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleDeclareStack: ToolHandler<DeclareStackRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const requestBody: any = {};
    if (args.desiredServices) requestBody.desiredServices = args.desiredServices;
    if (args.desiredVolumes) requestBody.desiredVolumes = args.desiredVolumes;
    
    const response = await client.typedApi.container.declareStack({
      stackId: args.stackId,
      data: requestBody,
    });
    
    if (String(response.status).startsWith('2') && (response as any).data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.declareStack,
        result: (response as any).data,
      });
    }
    
    throw new Error(`Failed to declare stack: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to declare container stack: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};