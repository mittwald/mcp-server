/**
 * @file Tool constants and utilities for the MCP server
 * @module constants/tools
 * 
 * @remarks
 * This module aggregates all available MCP tools and provides utilities
 * for tool management. Tools are the primary way clients interact with
 * the MCP server.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools | MCP Tools Specification}
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ELICITATION_EXAMPLE_TOOL } from './tool/elicitation-example.js';
import { MCP_LOGGING_TOOL } from './tool/logging.js';

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
 * Array of all available MCP tools.
 * 
 * @remarks
 * Currently includes:
 * - Example/Tutorial tools:
 *   - `elicitation_example`: Demonstrates requesting user input
 * - Utility tools:
 *   - `mcp_logging`: Request server to log messages for debugging
 * 
 * Mittwald CLI-based tools will be added here after migration.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools | MCP Tools}
 */
export const TOOLS: Tool[] = [
  // Example and utility tools
  ELICITATION_EXAMPLE_TOOL,
  MCP_LOGGING_TOOL,
  
  // Mittwald CLI-based tools will be added here
  // Format: mittwald_{category}_{subcommand}_{action}
];

/**
 * Populates tools with initial data from configuration.
 * 
 * @remarks
 * This function can be used to inject user-specific data into tools
 * at initialization time. Currently, it creates a clone of each tool
 * to avoid modifying the original tool definitions.
 * 
 * @param tools - Array of tool definitions to populate
 * @param configData - Configuration data
 * @returns Array of populated tool definitions
 * 
 * @example
 * ```typescript
 * const populatedTools = populateToolsInitialData(TOOLS, config);
 * ```
 */
export function populateToolsInitialData(tools: Tool[], _configData: any): Tool[] {
  return tools.map((tool) => {
    const clonedTool = { ...tool };
    return clonedTool;
  });
}