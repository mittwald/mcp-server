/**
 * Container Service management handlers
 * 
 * @module handlers/tools/mittwald/container/service-management
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
import type { ToolHandler } from '../../types.js';
import type {
  GetServiceRequest,
  ListServicesRequest,
  GetServiceLogsRequest,
  ServiceActionRequest,
} from '../../../../types/mittwald/container.js';
import { containerToolSuccessMessages } from '../../../../constants/tool/mittwald/container/index.js';

export const handleListServices: ToolHandler<ListServicesRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const queryParams: any = {};
    if (args.limit) queryParams.limit = args.limit;
    if (args.skip) queryParams.skip = args.skip;
    if (args.page) queryParams.page = args.page;
    
    const response = await client.typedApi.container.listServices({
      projectId: args.projectId,
      queryParameters: queryParams,
    });
    
    if (String(response.status).startsWith('2') && (response as any).data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.listServices,
        result: (response as any).data,
      });
    }
    
    throw new Error(`Failed to list services: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list container services: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleGetService: ToolHandler<GetServiceRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.container.getService({
      stackId: args.stackId,
      serviceId: args.serviceId,
    });
    
    if (String(response.status).startsWith('2') && (response as any).data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.getService,
        result: (response as any).data,
      });
    }
    
    throw new Error(`Failed to get service: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get container service: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleGetServiceLogs: ToolHandler<GetServiceLogsRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const queryParams: any = {};
    if (args.since) queryParams.since = args.since;
    if (args.until) queryParams.until = args.until;
    if (args.limit) queryParams.limit = args.limit;
    
    const response = await client.typedApi.container.getServiceLogs({
      stackId: args.stackId,
      serviceId: args.serviceId,
      ...queryParams
    });
    
    if (String(response.status).startsWith('2') && (response as any).data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.getServiceLogs,
        result: (response as any).data,
      });
    }
    
    throw new Error(`Failed to get service logs: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get service logs: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleStartService: ToolHandler<ServiceActionRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.container.startService({
      stackId: args.stackId,
      serviceId: args.serviceId,
    });
    
    if (String(response.status).startsWith('2') && (response as any).data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.startService,
        result: (response as any).data,
      });
    }
    
    throw new Error(`Failed to start service: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to start container service: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleStopService: ToolHandler<ServiceActionRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.container.stopService({
      stackId: args.stackId,
      serviceId: args.serviceId,
    });
    
    if (String(response.status).startsWith('2') && (response as any).data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.stopService,
        result: (response as any).data,
      });
    }
    
    throw new Error(`Failed to stop service: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to stop container service: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleRestartService: ToolHandler<ServiceActionRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.container.restartService({
      stackId: args.stackId,
      serviceId: args.serviceId,
    });
    
    if (String(response.status).startsWith('2')) {
      return formatToolResponse({
        message: containerToolSuccessMessages.restartService,
        result: (response as any).data ?? {},
      });
    }
    
    throw new Error(`Failed to restart service: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to restart container service: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleRecreateService: ToolHandler<ServiceActionRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.container.recreateService({
      stackId: args.stackId,
      serviceId: args.serviceId,
    });
    
    if (String(response.status).startsWith('2')) {
      return formatToolResponse({
        message: containerToolSuccessMessages.recreateService,
        result: (response as any).data ?? {},
      });
    }
    
    throw new Error(`Failed to recreate service: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to recreate container service: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handlePullImageForService: ToolHandler<ServiceActionRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.container.pullImageForService({
      stackId: args.stackId,
      serviceId: args.serviceId,
    });
    
    if (String(response.status).startsWith('2')) {
      return formatToolResponse({
        message: containerToolSuccessMessages.pullImageForService,
        result: (response as any).data ?? {},
      });
    }
    
    throw new Error(`Failed to pull image for service: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to pull image for service: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};