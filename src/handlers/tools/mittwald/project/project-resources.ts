import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
// Removed unused imports
import {
  storageStatisticsSuccessMessage,
  storageThresholdSuccessMessage,
  // contractGetSuccessMessage, // Unused
  // ordersListSuccessMessage, // Unused
} from '../../../../constants/tool/mittwald/project/project-resources.js';

/**
 * Handler for getting storage statistics
 */
export async function handleProjectGetStorageStatistics(args: { projectId: string }) {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.project.storagespaceGetProjectStatistics({ 
      projectId: args.projectId 
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get storage statistics: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: storageStatisticsSuccessMessage,
      result: {
        projectId: args.projectId,
        statistics: response.data,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get storage statistics: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for updating storage notification threshold
 */
export async function handleProjectUpdateStorageThreshold(args: { 
  projectId: string; 
  enabled: boolean; 
  thresholdPercentage: number 
}) {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.project.storagespaceReplaceProjectNotificationThreshold({
      projectId: args.projectId,
      data: {
        notificationThresholdInBytes: Math.floor(args.thresholdPercentage * 1024 * 1024 * 1024 / 100), // Convert percentage to bytes (assuming 1GB base)
      },
    });

    if (response.status !== 204) {
      throw new Error(`Failed to update storage threshold: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: storageThresholdSuccessMessage,
      result: {
        projectId: args.projectId,
        enabled: args.enabled,
        thresholdPercentage: args.thresholdPercentage,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update storage threshold: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for getting project contract (not available in current API)
 */
export async function handleProjectGetContract(_args: { projectId: string }) {
  return formatToolResponse({
    status: "error",
    message: "Project contract functionality is not available in the current Mittwald API",
    error: {
      type: "NOT_IMPLEMENTED",
      details: "This feature may be available in a future API version or through the contract domain",
    },
  });
}

/**
 * Handler for listing project orders (not available in current API)
 */
export async function handleProjectListOrders(_args: { projectId: string; limit?: number; skip?: number }) {
  return formatToolResponse({
    status: "error",
    message: "List project orders functionality is not available in the current Mittwald API",
    error: {
      type: "NOT_IMPLEMENTED", 
      details: "This feature may be available through the contract domain",
    },
  });
}