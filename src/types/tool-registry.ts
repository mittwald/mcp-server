/**
 * @file Tool registry type definitions
 * @module types/tool-registry
 * 
 * @remarks
 * This module defines the interfaces and types used for the dynamic tool
 * registration system. It provides a standardized way for tools to export
 * themselves and be discovered by the system.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Function type for tool handlers
 */
export type ToolHandler = (args: any) => Promise<CallToolResult>;

/**
 * Interface for tool registration
 * 
 * @remarks
 * This interface defines the standard structure that CLI tools must implement
 * to be automatically discovered and registered by the system.
 */
export interface ToolRegistration {
  /** The tool definition following MCP Tool specification */
  tool: Tool;
  
  /** The handler function for this tool */
  handler: ToolHandler;
  
  /** Optional validation schema for the tool's input */
  schema?: any;
}

/**
 * Collection of loaded tools and their handlers
 */
export interface ToolRegistry {
  /** Map of tool names to their definitions */
  tools: Map<string, Tool>;
  
  /** Map of tool names to their handlers */
  handlers: Map<string, ToolHandler>;
  
  /** Map of tool names to their schemas */
  schemas: Map<string, any>;
}

/**
 * Options for tool scanning
 */
export interface ToolScanOptions {
  /** Base directory to scan for tools */
  baseDir: string;
  
  /** Pattern to match tool files (default: wildcard-cli.ts) */
  pattern?: string;
  
  /** Whether to include subdirectories */
  recursive?: boolean;
}

/**
 * Result of tool scanning operation
 */
export interface ToolScanResult {
  /** Number of tools successfully loaded */
  loaded: number;
  
  /** Number of tools that failed to load */
  failed: number;
  
  /** Details of failed tool loads */
  failures: Array<{
    file: string;
    error: string;
  }>;
  
  /** List of loaded tool names */
  toolNames: string[];
}