/**
 * @file Resource constants for the MCP server
 * @module constants/resources
 */

/**
 * Resource definitions for the MCP server
 */
export const RESOURCES = [
  {
    uri: "mittwald://container-comprehensive-guide",
    name: "Mittwald Container Operations Complete Guide",
    description: "Comprehensive guide for safely working with Mittwald container stacks, including safety guidelines, common pitfalls, and best practices",
    mimeType: "text/markdown",
  },
] as const;


/**
 * Server information constants
 */
export const SERVER_INFO = {
  name: "systemprompt-mcp-reddit",
  version: "2.0.0",
} as const;

/**
 * Error messages for resource operations
 */
export const RESOURCE_ERROR_MESSAGES = {
  INVALID_URI: (uri: string) => `Invalid resource URI: ${uri}. Available resources: mittwald://container-comprehensive-guide`,
  FETCH_FAILED: (error: unknown) => `Failed to fetch resource: ${error instanceof Error ? error.message : "Unknown error"}`,
  LIST_FAILED: (error: unknown) => `Failed to list resources: ${error instanceof Error ? error.message : "Unknown error"}`,
} as const;