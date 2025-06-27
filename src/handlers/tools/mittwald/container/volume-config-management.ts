/**
 * Container Volume and Config management handlers
 * 
 * @module handlers/tools/mittwald/container/volume-config-management
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
import type { ToolHandler } from '../../types.js';
import type {
  GetVolumeRequest,
  ListVolumesRequest,
  DeleteVolumeRequest,
} from '../../../../types/mittwald/container.js';
import { containerToolSuccessMessages } from '../../../../constants/tool/mittwald/container/index.js';

export const handleListVolumes: ToolHandler<ListVolumesRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const queryParams: any = {};
    if (args.limit) queryParams.limit = args.limit;
    if (args.skip) queryParams.skip = args.skip;
    if (args.page) queryParams.page = args.page;
    
    const response = await client.api.container.listVolumes({
      pathParameters: {
        projectId: args.projectId,
      },
      queryParameters: queryParams,
    });
    
    if (response.status === 200 && response.data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.listVolumes,
        result: response.data,
      });
    }
    
    throw new Error(`Failed to list volumes: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list container volumes: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleGetVolume: ToolHandler<GetVolumeRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.container.getVolume({
      pathParameters: {
        stackId: args.stackId,
        volumeId: args.volumeId,
      },
    });
    
    if (response.status === 200 && response.data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.getVolume,
        result: response.data,
      });
    }
    
    throw new Error(`Failed to get volume: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get container volume: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleDeleteVolume: ToolHandler<DeleteVolumeRequest> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.container.deleteVolume({
      pathParameters: {
        stackId: args.stackId,
        volumeId: args.volumeId,
      },
    });
    
    if (response.status === 204) {
      return formatToolResponse({
        message: containerToolSuccessMessages.deleteVolume,
        result: { deleted: true, volumeId: args.volumeId, stackId: args.stackId },
      });
    }
    
    throw new Error(`Failed to delete volume: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete container volume: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};

export const handleGetContainerImageConfig: ToolHandler<{}> = async () => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.container.getContainerImageConfig({});
    
    if (response.status === 200 && response.data) {
      return formatToolResponse({
        message: containerToolSuccessMessages.getContainerImageConfig,
        result: response.data,
      });
    }
    
    throw new Error(`Failed to get container image config: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get container image config: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};