/**
 * @file Mittwald Filesystem MCP tool definitions
 * @module constants/tool/mittwald/filesystem
 * 
 * @remarks
 * This module defines all MCP tools for Mittwald project filesystem operations.
 * Based on 9 filesystem API endpoints from the Mittwald API (5 current + 4 deprecated).
 * Only implementing the current (non-deprecated) endpoints.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool to list directories in a project's filesystem
 */
export const mittwaldFilesystemListDirectories: Tool = {
  name: "mittwald_filesystem_list_directories",
  description: "List directories belonging to a Mittwald project's filesystem. Retrieves the directory structure with metadata such as permissions, modification times, and sizes.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project to list directories for"
      },
      path: {
        type: "string",
        description: "Optional path to list directories from (defaults to root if not specified)"
      }
    },
    required: ["projectId"]
  },
  _meta: {
    title: "List Project Directories",
    type: "server"
  }
};

/**
 * Tool to get filesystem disk usage for a project
 */
export const mittwaldFilesystemGetDiskUsage: Tool = {
  name: "mittwald_filesystem_get_disk_usage",
  description: "Get disk usage information for a Mittwald project's filesystem including total space, used space, available space, and usage by directory.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project to get disk usage for"
      },
      path: {
        type: "string",
        description: "Optional specific directory path to get usage for (defaults to entire project if not specified)"
      }
    },
    required: ["projectId"]
  },
  _meta: {
    title: "Get Project Disk Usage",
    type: "server"
  }
};

/**
 * Tool to get file content from a project's filesystem
 */
export const mittwaldFilesystemGetFileContent: Tool = {
  name: "mittwald_filesystem_get_file_content",
  description: "Get the content of a specific file from a Mittwald project's filesystem. Returns the raw file content as text or binary data.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project"
      },
      filePath: {
        type: "string",
        description: "Full path to the file to retrieve content from"
      }
    },
    required: ["projectId", "filePath"]
  },
  _meta: {
    title: "Get File Content",
    type: "server"
  }
};

/**
 * Tool to get a project's filesystem authorization JWT token
 */
export const mittwaldFilesystemGetJWT: Tool = {
  name: "mittwald_filesystem_get_jwt",
  description: "Get a project's file/filesystem authorization token (JWT) for authenticated access to filesystem operations. This token can be used for direct filesystem API calls.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project to get JWT token for"
      }
    },
    required: ["projectId"]
  },
  _meta: {
    title: "Get Filesystem JWT Token",
    type: "server"
  }
};

/**
 * Tool to list files in a project's filesystem
 */
export const mittwaldFilesystemListFiles: Tool = {
  name: "mittwald_filesystem_list_files",
  description: "Get information about files in a Mittwald project's filesystem including metadata such as size, permissions, modification times, and file types.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project to list files for"
      },
      path: {
        type: "string",
        description: "Optional path to list files from (defaults to root if not specified)"
      },
      recursive: {
        type: "boolean",
        description: "Whether to list files recursively in subdirectories"
      }
    },
    required: ["projectId"]
  },
  _meta: {
    title: "List Project Files",
    type: "server"
  }
};

export const MITTWALD_FILESYSTEM_TOOLS: Tool[] = [
  mittwaldFilesystemListDirectories,
  mittwaldFilesystemGetDiskUsage,
  mittwaldFilesystemGetFileContent,
  mittwaldFilesystemGetJWT,
  mittwaldFilesystemListFiles
];