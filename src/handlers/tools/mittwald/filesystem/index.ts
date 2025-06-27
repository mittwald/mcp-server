/**
 * @file Mittwald Filesystem MCP tool handlers
 * @module handlers/tools/mittwald/filesystem
 * 
 * @remarks
 * This module implements handlers for all Mittwald filesystem MCP tools.
 * Uses the official Mittwald API client to interact with project filesystem endpoints.
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
import type { ToolHandler } from '../../types.js';

// Type definitions for filesystem operations
export interface MittwaldFilesystemListDirectoriesArgs {
  projectId: string;
  path?: string;
}

export interface MittwaldFilesystemGetDiskUsageArgs {
  projectId: string;
  path?: string;
}

export interface MittwaldFilesystemGetFileContentArgs {
  projectId: string;
  filePath: string;
}

export interface MittwaldFilesystemGetJWTArgs {
  projectId: string;
}

export interface MittwaldFilesystemListFilesArgs {
  projectId: string;
  path?: string;
  recursive?: boolean;
}

/**
 * Handler for listing directories in a project's filesystem
 */
export const handleMittwaldFilesystemListDirectories: ToolHandler<MittwaldFilesystemListDirectoriesArgs> = async (args, context) => {
  try {
    const client = getMittwaldClient();
    const queryParameters: any = {};
    
    if (args.path) {
      queryParameters.directory = args.path;
    }

    const response = await client.api.projectFileSystem.getDirectories({
      projectId: args.projectId,
      queryParameters
    });

    if (response.status >= 400) {
      throw new Error(`Failed to list directories: ${response.status}`);
    }

    const directoryData = response.data;
    return formatToolResponse({
      message: "Successfully retrieved project directories",
      result: {
        directories: directoryData,
        projectId: args.projectId,
        path: args.path || "/",
        count: Array.isArray(directoryData) ? directoryData.length : (directoryData ? 1 : 0)
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list directories: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for getting project filesystem disk usage
 */
export const handleMittwaldFilesystemGetDiskUsage: ToolHandler<MittwaldFilesystemGetDiskUsageArgs> = async (args, context) => {
  try {
    const client = getMittwaldClient();
    const queryParameters: any = {};
    
    if (args.path) {
      queryParameters.directory = args.path;
    }

    const response = await client.api.projectFileSystem.getDiskUsage({
      projectId: args.projectId,
      queryParameters
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get disk usage: ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved disk usage information",
      result: {
        diskUsage: response.data,
        projectId: args.projectId,
        path: args.path || "/"
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get disk usage: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for getting file content from project filesystem
 */
export const handleMittwaldFilesystemGetFileContent: ToolHandler<MittwaldFilesystemGetFileContentArgs> = async (args, context) => {
  try {
    const client = getMittwaldClient();
    const response = await client.api.projectFileSystem.getFileContent({
      projectId: args.projectId,
      queryParameters: { file: args.filePath }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get file content: ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved file content",
      result: {
        content: response.data,
        projectId: args.projectId,
        filePath: args.filePath,
        // Note: The actual content format depends on the file type
        // It could be text, binary data, etc.
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get file content: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for getting project filesystem JWT token
 */
export const handleMittwaldFilesystemGetJWT: ToolHandler<MittwaldFilesystemGetJWTArgs> = async (args, context) => {
  try {
    const client = getMittwaldClient();
    const response = await client.api.projectFileSystem.getJwt({
      projectId: args.projectId
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get JWT token: ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved filesystem JWT token",
      result: {
        jwt: response.data,
        projectId: args.projectId
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get JWT token: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for listing files in a project's filesystem
 */
export const handleMittwaldFilesystemListFiles: ToolHandler<MittwaldFilesystemListFilesArgs> = async (args, context) => {
  try {
    const client = getMittwaldClient();
    const queryParameters: any = {};
    
    if (args.path) {
      queryParameters.directory = args.path;
    }
    if (args.recursive !== undefined) {
      queryParameters.recursive = args.recursive;
    }

    const response = await client.api.projectFileSystem.listFiles({
      projectId: args.projectId,
      queryParameters
    });

    if (response.status !== 200) {
      throw new Error(`Failed to list files: ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved project files information",
      result: {
        files: response.data,
        projectId: args.projectId,
        path: args.path || "/",
        recursive: args.recursive || false,
        count: Array.isArray(response.data) ? response.data.length : (response.data ? 1 : 0)
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list files: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};