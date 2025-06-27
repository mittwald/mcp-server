/**
 * @file Tool constants and utilities for the Reddit MCP server
 * @module constants/tools
 * 
 * @remarks
 * This module aggregates all available MCP tools and provides utilities
 * for tool management. Tools are the primary way clients interact with
 * the Reddit API through this MCP server.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools | MCP Tools Specification}
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getChannel } from '../constants/tool/get-channel.js';
import { getComment } from '../constants/tool/get-comment.js';
import { getNotifications } from '../constants/tool/get-notifications.js';
import { getPost } from '../constants/tool/get-post.js';
import { searchReddit } from '../constants/tool/search-reddit.js';
import { ELICITATION_EXAMPLE_TOOL } from './tool/elicitation-example.js';
import { SAMPLING_EXAMPLE_TOOL } from './tool/sampling-example.js';
import { STRUCTURED_DATA_EXAMPLE_TOOL } from './tool/structured-data-example.js';
import { MCP_LOGGING_TOOL } from './tool/logging.js';
import { VALIDATION_EXAMPLE_TOOL } from './tool/validation-example.js';
import { MITTWALD_PROJECT_TOOLS } from './tool/mittwald/project/index.js';
import { MITTWALD_DOMAIN_TOOLS } from './tool/mittwald/domain/index.js';
import type { RedditConfigData } from '../types/config.js';
// Mittwald App API tools
import {
  mittwald_app_list,
  mittwald_app_get,
  mittwald_app_list_versions,
  mittwald_app_get_version,
  mittwald_app_get_version_update_candidates,
  mittwald_app_installation_list,
  mittwald_app_installation_get,
  mittwald_app_installation_create,
  mittwald_app_installation_update,
  mittwald_app_installation_delete,
  mittwald_app_installation_action,
  mittwald_app_installation_copy,
  mittwald_app_installation_get_status,
  mittwald_app_installation_get_missing_dependencies,
  mittwald_system_software_list,
  mittwald_system_software_get,
  mittwald_system_software_list_versions,
  mittwald_system_software_get_version,
  mittwald_app_installation_get_system_software,
  mittwald_app_installation_update_system_software
} from './tool/mittwald/app/index.js';

// Import all Mittwald User API tools
import * as MittwaldUserTools from './tool/mittwald/user/index.js';

// Import all Mittwald SSH/SFTP and Backup tools
import {
  mittwaldListSshKeys,
  mittwaldCreateSshKey,
  mittwaldGetSshKey,
  mittwaldUpdateSshKey,
  mittwaldDeleteSshKey,
  mittwaldListSshUsers,
  mittwaldCreateSshUser,
  mittwaldGetSshUser,
  mittwaldUpdateSshUser,
  mittwaldDeleteSshUser,
  mittwaldListSftpUsers,
  mittwaldCreateSftpUser,
  mittwaldGetSftpUser,
  mittwaldUpdateSftpUser,
  mittwaldDeleteSftpUser,
  mittwaldListBackups,
  mittwaldCreateBackup,
  mittwaldGetBackup,
  mittwaldDeleteBackup,
  mittwaldUpdateBackupDescription,
  mittwaldCreateBackupExport,
  mittwaldDeleteBackupExport,
  mittwaldListBackupSchedules,
  mittwaldCreateBackupSchedule,
  mittwaldGetBackupSchedule,
  mittwaldUpdateBackupSchedule,
  mittwaldDeleteBackupSchedule,
} from './tool/mittwald/ssh-backup/index.js';

/**
 * Standard error messages for tool operations.
 * 
 * @remarks
 * These messages are used when tool calls fail or when
 * an unknown tool is requested.
 */
export const TOOL_ERROR_MESSAGES = {
  /** Prefix for unknown tool errors */
  UNKNOWN_TOOL: 'Unknown tool:',
  /** Prefix for tool execution failures */
  TOOL_CALL_FAILED: 'Tool call failed:',
} as const;

/**
 * Standard response messages for tool operations.
 * 
 * @remarks
 * These messages are used for special tool responses,
 * such as when a tool triggers an asynchronous operation.
 */
export const TOOL_RESPONSE_MESSAGES = {
  /** Message returned when a tool triggers async processing (e.g., sampling) */
  ASYNC_PROCESSING: 'Request is being processed asynchronously',
} as const;

/**
 * Array of all available MCP tools for Reddit operations.
 * 
 * @remarks
 * Each tool provides specific functionality for interacting with Reddit:
 * - `getChannel`: Fetch subreddit information
 * - `getPost`: Retrieve a specific Reddit post
 * - `getNotifications`: Get user notifications and messages
 * - `searchReddit`: Search across Reddit
 * - `getComment`: Retrieve a specific comment
 * 
 * Example/Tutorial tools:
 * - `elicitation_example`: Demonstrates requesting user input
 * - `sampling_example`: Demonstrates AI-assisted operations
 * - `structured_data_example`: Demonstrates returning structured data
 * 
 * Utility tools:
 * - `mcp_logging`: Request server to log messages for debugging
 * 
 * Tools that modify Reddit content (create, edit, delete) use the sampling
 * feature to generate content with AI assistance.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools | MCP Tools}
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/client/sampling | MCP Sampling}
 */
export const TOOLS: Tool[] = [
  // Reddit tools
  getChannel,
  getPost,
  getNotifications,
  searchReddit,
  getComment,
  
  // Example and utility tools
  ELICITATION_EXAMPLE_TOOL,
  SAMPLING_EXAMPLE_TOOL,
  STRUCTURED_DATA_EXAMPLE_TOOL,
  MCP_LOGGING_TOOL,
  VALIDATION_EXAMPLE_TOOL,
  
  // Mittwald User API tools
  ...Object.values(MittwaldUserTools).filter(tool => 
    typeof tool === 'object' && 
    tool !== null && 
    'name' in tool && 
    'inputSchema' in tool
  ) as Tool[],
  
  // Mittwald Project API tools
  ...MITTWALD_PROJECT_TOOLS,
  
  // Mittwald Domain API tools
  ...MITTWALD_DOMAIN_TOOLS,
  
  // Mittwald App API tools
  mittwald_app_list,
  mittwald_app_get,
  mittwald_app_list_versions,
  mittwald_app_get_version,
  mittwald_app_get_version_update_candidates,
  mittwald_app_installation_list,
  mittwald_app_installation_get,
  mittwald_app_installation_create,
  mittwald_app_installation_update,
  mittwald_app_installation_delete,
  mittwald_app_installation_action,
  mittwald_app_installation_copy,
  mittwald_app_installation_get_status,
  mittwald_app_installation_get_missing_dependencies,
  mittwald_system_software_list,
  mittwald_system_software_get,
  mittwald_system_software_list_versions,
  mittwald_system_software_get_version,
  mittwald_app_installation_get_system_software,
  mittwald_app_installation_update_system_software,
  
  // Mittwald SSH/SFTP and Backup tools
  // SSH Keys
  mittwaldListSshKeys,
  mittwaldCreateSshKey,
  mittwaldGetSshKey,
  mittwaldUpdateSshKey,
  mittwaldDeleteSshKey,
  
  // SSH Users
  mittwaldListSshUsers,
  mittwaldCreateSshUser,
  mittwaldGetSshUser,
  mittwaldUpdateSshUser,
  mittwaldDeleteSshUser,
  
  // SFTP Users
  mittwaldListSftpUsers,
  mittwaldCreateSftpUser,
  mittwaldGetSftpUser,
  mittwaldUpdateSftpUser,
  mittwaldDeleteSftpUser,
  
  // Backups
  mittwaldListBackups,
  mittwaldCreateBackup,
  mittwaldGetBackup,
  mittwaldDeleteBackup,
  mittwaldUpdateBackupDescription,
  mittwaldCreateBackupExport,
  mittwaldDeleteBackupExport,
  
  // Backup Schedules
  mittwaldListBackupSchedules,
  mittwaldCreateBackupSchedule,
  mittwaldGetBackupSchedule,
  mittwaldUpdateBackupSchedule,
  mittwaldDeleteBackupSchedule
];

/**
 * Populates tools with initial data from Reddit configuration.
 * 
 * @remarks
 * This function can be used to inject user-specific data into tools
 * at initialization time. Currently, it creates a clone of each tool
 * to avoid modifying the original tool definitions.
 * 
 * @param tools - Array of tool definitions to populate
 * @param configData - Reddit configuration data containing user info
 * @returns Array of populated tool definitions
 * 
 * @example
 * ```typescript
 * const populatedTools = populateToolsInitialData(TOOLS, redditConfig);
 * ```
 */
export function populateToolsInitialData(tools: Tool[], _configData: RedditConfigData): Tool[] {
  return tools.map((tool) => {
    const clonedTool = { ...tool };
    return clonedTool;
  });
}
