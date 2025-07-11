/**
 * @file Tool constants and utilities for the MCP server
 * @module constants/tools
 * 
 * @remarks
 * This module aggregates all available MCP tools and provides utilities
 * for tool management. Tools are dynamically loaded from CLI tool files.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools | MCP Tools Specification}
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getToolRegistry } from '../utils/tool-scanner.js';
import { resolve } from 'path';
import { logger } from '../utils/logger.js';

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
 * Cached tool registry for performance
 */
let toolRegistry: Awaited<ReturnType<typeof getToolRegistry>> | null = null;

/**
 * Gets all available CLI tools by scanning the file system
 * 
 * @remarks
 * This function dynamically loads all CLI tools from the file system.
 * Tools are cached after the first load for performance.
 * 
 * @returns Promise that resolves to an array of Tool definitions
 */
export async function loadCliTools(): Promise<Tool[]> {
  if (!toolRegistry) {
    logger.info(`Loading CLI tools dynamically`);
    
    try {
      toolRegistry = await getToolRegistry();
      logger.info(`Loaded ${toolRegistry.tools.size} CLI tools dynamically`);
    } catch (error) {
      logger.error('Failed to load CLI tools:', error);
      return [];
    }
  }
  
  return Array.from(toolRegistry.tools.values());
}

/**
 * Array of all available MCP tools.
 * 
 * @remarks
 * This is the main export that provides all tools to the MCP server.
 * It includes only CLI tools that are dynamically loaded.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools | MCP Tools}
 */
export const TOOLS: Tool[] = [];

/**
 * Initialize tools by loading them dynamically
 * 
 * @remarks
 * This function should be called during server startup to populate the TOOLS array
 */
export async function initializeTools(): Promise<void> {
  const cliTools = await loadCliTools();
  TOOLS.length = 0; // Clear existing tools
  TOOLS.push(...cliTools);
  logger.info(`Initialized ${TOOLS.length} tools`);
}

/**
 * Get tool handler by name
 * 
 * @param toolName - Name of the tool
 * @returns Tool handler function or null if not found
 */
export async function getToolHandler(toolName: string) {
  if (!toolRegistry) {
    await loadCliTools();
  }
  
  return toolRegistry?.handlers.get(toolName) || null;
}

/**
 * Get tool schema by name
 * 
 * @param toolName - Name of the tool
 * @returns Tool schema or null if not found
 */
export async function getToolSchema(toolName: string) {
  if (!toolRegistry) {
    await loadCliTools();
  }
  
  return toolRegistry?.schemas.get(toolName) || null;
}

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