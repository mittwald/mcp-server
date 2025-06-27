/**
 * @file Mittwald Cronjob MCP tool handlers
 * @module handlers/tools/mittwald/cronjob
 * 
 * @remarks
 * This module implements handlers for all Mittwald cronjob MCP tools.
 * Uses the official Mittwald API client to interact with cronjob endpoints.
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
import type { ToolHandler } from '../../types.js';

// Type definitions for cronjob operations
export interface MittwaldCronjobListArgs {
  projectId: string;
}

export interface MittwaldCronjobCreateArgs {
  projectId: string;
  schedule: string;
  command: string;
  description?: string;
  appId?: string;
}

export interface MittwaldCronjobGetArgs {
  cronjobId: string;
}

export interface MittwaldCronjobUpdateArgs {
  cronjobId: string;
  schedule?: string;
  command?: string;
  description?: string;
  enabled?: boolean;
}

export interface MittwaldCronjobDeleteArgs {
  cronjobId: string;
}

export interface MittwaldCronjobUpdateAppIdArgs {
  cronjobId: string;
  appId: string;
}

export interface MittwaldCronjobTriggerArgs {
  cronjobId: string;
}

export interface MittwaldCronjobListExecutionsArgs {
  cronjobId: string;
}

export interface MittwaldCronjobGetExecutionArgs {
  cronjobId: string;
  executionId: string;
}

export interface MittwaldCronjobAbortExecutionArgs {
  cronjobId: string;
  executionId: string;
}

/**
 * Handler for listing cronjobs in a project
 */
export const handleMittwaldCronjobList: ToolHandler<MittwaldCronjobListArgs> = async (args, context) => {
  try {
    const client = getMittwaldClient();
    const response = await client.api.cronjob.listCronjobs({
      projectId: args.projectId
    });

    if (response.status !== 200) {
      throw new Error(`Failed to list cronjobs: ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved cronjobs for project",
      result: {
        cronjobs: response.data,
        projectId: args.projectId,
        count: response.data?.length || 0
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list cronjobs: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for creating a new cronjob
 */
export const handleMittwaldCronjobCreate: ToolHandler<MittwaldCronjobCreateArgs> = async (args, context) => {
  try {
    const client = getMittwaldClient();
    
    // For now, use simplified creation - the full complex structure will be handled
    // by the actual API client implementation. We'll pass what we have.
    const requestData: any = {
      active: true,
      interval: args.schedule, // Use schedule as interval for now
      description: args.description || "Cronjob created via MCP",
      destination: {
        interpreter: "/bin/bash",
        path: args.command,
        parameters: ""
      },
      timeout: 3600 // Default 1 hour timeout
    };

    if (args.appId) {
      requestData.appId = args.appId;
    }

    const response = await client.api.cronjob.createCronjob({
      projectId: args.projectId,
      data: requestData
    });

    if (response.status !== 201) {
      throw new Error(`Failed to create cronjob: ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully created cronjob",
      result: {
        cronjob: response.data,
        projectId: args.projectId
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create cronjob: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for getting cronjob details
 */
export const handleMittwaldCronjobGet: ToolHandler<MittwaldCronjobGetArgs> = async (args, context) => {
  try {
    const client = getMittwaldClient();
    const response = await client.api.cronjob.getCronjob({
      cronjobId: args.cronjobId
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get cronjob: ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved cronjob details",
      result: {
        cronjob: response.data
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get cronjob: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for updating a cronjob
 */
export const handleMittwaldCronjobUpdate: ToolHandler<MittwaldCronjobUpdateArgs> = async (args, context) => {
  try {
    const client = getMittwaldClient();
    const updateData: any = {};

    if (args.schedule !== undefined) updateData.schedule = args.schedule;
    if (args.command !== undefined) updateData.command = args.command;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.enabled !== undefined) updateData.enabled = args.enabled;

    const response = await client.api.cronjob.updateCronjob({
      cronjobId: args.cronjobId,
      data: updateData
    });

    if (response.status >= 400) {
      throw new Error(`Failed to update cronjob: ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully updated cronjob",
      result: {
        cronjob: response.data || { updated: true }
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update cronjob: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for deleting a cronjob
 */
export const handleMittwaldCronjobDelete: ToolHandler<MittwaldCronjobDeleteArgs> = async (args, context) => {
  try {
    const client = getMittwaldClient();
    const response = await client.api.cronjob.deleteCronjob({
      cronjobId: args.cronjobId
    });

    if (response.status >= 400) {
      throw new Error(`Failed to delete cronjob: ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully deleted cronjob",
      result: {
        cronjobId: args.cronjobId,
        deleted: true
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete cronjob: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for updating cronjob app ID
 */
export const handleMittwaldCronjobUpdateAppId: ToolHandler<MittwaldCronjobUpdateAppIdArgs> = async (args, context) => {
  try {
    const client = getMittwaldClient();
    const response = await client.api.cronjob.updateCronjobAppId({
      cronjobId: args.cronjobId,
      data: {
        appId: args.appId
      }
    });

    if (response.status >= 400) {
      throw new Error(`Failed to update cronjob app ID: ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully updated cronjob app ID",
      result: {
        cronjobId: args.cronjobId,
        appId: args.appId
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update cronjob app ID: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for triggering a cronjob execution
 */
export const handleMittwaldCronjobTrigger: ToolHandler<MittwaldCronjobTriggerArgs> = async (args, context) => {
  try {
    const client = getMittwaldClient();
    const response = await client.api.cronjob.createExecution({
      cronjobId: args.cronjobId
    });

    if (response.status !== 201) {
      throw new Error(`Failed to trigger cronjob execution: ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully triggered cronjob execution",
      result: {
        execution: response.data,
        cronjobId: args.cronjobId
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to trigger cronjob execution: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for listing cronjob executions
 */
export const handleMittwaldCronjobListExecutions: ToolHandler<MittwaldCronjobListExecutionsArgs> = async (args, context) => {
  try {
    const client = getMittwaldClient();
    const response = await client.api.cronjob.listExecutions({
      cronjobId: args.cronjobId
    });

    if (response.status !== 200) {
      throw new Error(`Failed to list cronjob executions: ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved cronjob executions",
      result: {
        executions: response.data,
        cronjobId: args.cronjobId,
        count: response.data?.length || 0
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list cronjob executions: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for getting cronjob execution details
 */
export const handleMittwaldCronjobGetExecution: ToolHandler<MittwaldCronjobGetExecutionArgs> = async (args, context) => {
  try {
    const client = getMittwaldClient();
    const response = await client.api.cronjob.getExecution({
      cronjobId: args.cronjobId,
      executionId: args.executionId
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get cronjob execution: ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved cronjob execution details",
      result: {
        execution: response.data,
        cronjobId: args.cronjobId,
        executionId: args.executionId
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get cronjob execution: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for aborting a cronjob execution
 */
export const handleMittwaldCronjobAbortExecution: ToolHandler<MittwaldCronjobAbortExecutionArgs> = async (args, context) => {
  try {
    const client = getMittwaldClient();
    const response = await client.api.cronjob.abortExecution({
      cronjobId: args.cronjobId,
      executionId: args.executionId
    });

    if (response.status !== 204) {
      throw new Error(`Failed to abort cronjob execution: ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully aborted cronjob execution",
      result: {
        cronjobId: args.cronjobId,
        executionId: args.executionId,
        aborted: true
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to abort cronjob execution: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};