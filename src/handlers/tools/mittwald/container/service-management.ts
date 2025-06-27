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
    
    const response = await client.api.container.listServices({
      pathParameters: {
        projectId: args.projectId,
      },
      queryParameters: queryParams,
    });
    
    if (response.status === 200 && response.data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.listServices,
        result: response.data,
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
    
    const response = await client.api.container.getService({
      pathParameters: {
        stackId: args.stackId,
        serviceId: args.serviceId,
      },
    });
    
    if (response.status === 200 && response.data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.getService,
        result: response.data,
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
    
    const response = await client.api.container.getServiceLogs({
      pathParameters: {
        stackId: args.stackId,
        serviceId: args.serviceId,
      },
      queryParameters: queryParams,
    });
    
    if (response.status === 200 && response.data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.getServiceLogs,
        result: response.data,
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
    
    const response = await client.api.container.startService({
      pathParameters: {
        stackId: args.stackId,
        serviceId: args.serviceId,
      },
    });
    
    if (response.status === 200 && response.data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.startService,
        result: response.data,
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
    
    const response = await client.api.container.stopService({
      pathParameters: {
        stackId: args.stackId,
        serviceId: args.serviceId,
      },
    });
    
    if (response.status === 200 && response.data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.stopService,
        result: response.data,
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
    
    const response = await client.api.container.restartService({
      pathParameters: {
        stackId: args.stackId,
        serviceId: args.serviceId,
      },
    });
    
    if (response.status === 200 && response.data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.restartService,
        result: response.data,
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
    
    const response = await client.api.container.recreateService({
      pathParameters: {
        stackId: args.stackId,
        serviceId: args.serviceId,
      },
    });
    
    if (response.status === 200 && response.data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.recreateService,
        result: response.data,
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
    
    const response = await client.api.container.pullImageForService({
      pathParameters: {
        stackId: args.stackId,
        serviceId: args.serviceId,
      },
    });
    
    if (response.status === 200 && response.data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.pullImageForService,
        result: response.data,
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