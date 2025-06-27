import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// Get storage statistics
export const mittwald_project_get_storage_statistics: Tool = {
  name: "mittwald_project_get_storage_statistics",
  description: "Get storage usage statistics for a project",
  inputSchema: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID",
      },
    },
  },
};

// Update storage notification threshold
export const mittwald_project_update_storage_threshold: Tool = {
  name: "mittwald_project_update_storage_threshold",
  description: "Set or update the storage space notification threshold for a project",
  inputSchema: {
    type: "object",
    required: ["projectId", "enabled", "thresholdPercentage"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID",
      },
      enabled: {
        type: "boolean",
        description: "Whether storage notifications are enabled",
      },
      thresholdPercentage: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        description: "Storage usage percentage that triggers a notification",
      },
    },
  },
};

// Get project contract
export const mittwald_project_get_contract: Tool = {
  name: "mittwald_project_get_contract",
  description: "Get contract information for a project",
  inputSchema: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID",
      },
    },
  },
};

// List project orders
export const mittwald_project_list_orders: Tool = {
  name: "mittwald_project_list_orders",
  description: "List all orders associated with a project",
  inputSchema: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 50,
        description: "Maximum number of results to return",
      },
      skip: {
        type: "integer",
        minimum: 0,
        default: 0,
        description: "Number of results to skip for pagination",
      },
    },
  },
};

// Export success messages
export const storageStatisticsSuccessMessage = "Successfully retrieved storage statistics.";
export const storageThresholdSuccessMessage = "Storage notification threshold has been updated.";
export const contractGetSuccessMessage = "Successfully retrieved project contract information.";
export const ordersListSuccessMessage = "Successfully retrieved project orders.";