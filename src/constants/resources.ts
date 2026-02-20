/**
 * @file Resource constants for the MCP server
 * @module constants/resources
 */

import { resources } from '../resources/index.js';

/**
 * Resource definitions for the MCP server
 */
export const RESOURCES = resources;


/**
 * Server information constants
 */
export const SERVER_INFO = {
  name: "mittwald-mcp-server",
  version: "2.0.0",
} as const;

/**
 * Error messages for resource operations
 */
export const RESOURCE_ERROR_MESSAGES = {
  INVALID_URI: (uri: string) => `Invalid resource URI: ${uri}. Available resources: ${RESOURCES.map(r => r.uri).join(', ')}`,
  FETCH_FAILED: (error: unknown) => `Failed to fetch resource: ${error instanceof Error ? error.message : "Unknown error"}`,
  LIST_FAILED: (error: unknown) => `Failed to list resources: ${error instanceof Error ? error.message : "Unknown error"}`,
} as const;
