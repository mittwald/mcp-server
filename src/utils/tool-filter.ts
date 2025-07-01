/**
 * @file Tool filtering utilities for managing large tool lists
 * @module utils/tool-filter
 * 
 * @remarks
 * This module provides utilities to filter and paginate tools to prevent
 * overwhelming clients with large tool lists.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ToolFilterOptions {
  /** Maximum number of tools to return */
  maxTools?: number;
  /** Tool categories to include */
  categories?: string[];
  /** Specific tool names to include */
  allowedTools?: string[];
  /** Tool name prefix filter */
  prefix?: string;
  /** Cursor for pagination */
  cursor?: string;
}

export interface PaginatedToolsResult {
  tools: Tool[];
  nextCursor?: string;
  totalCount: number;
}

/**
 * Get tool category from tool name
 */
export function getToolCategory(toolName: string): string {
  const parts = toolName.split('_');
  if (parts.length >= 2 && parts[0] === 'mittwald') {
    return parts[1]; // e.g., 'app', 'project', 'database', etc.
  }
  return 'other';
}

/**
 * Filter tools based on provided options
 */
export function filterTools(allTools: Tool[], options: ToolFilterOptions = {}): PaginatedToolsResult {
  let filteredTools = [...allTools];
  
  // Apply allowed tools filter (highest priority)
  if (options.allowedTools && options.allowedTools.length > 0) {
    filteredTools = filteredTools.filter(tool => 
      options.allowedTools!.includes(tool.name)
    );
  } else {
    // Apply category filter
    if (options.categories && options.categories.length > 0) {
      filteredTools = filteredTools.filter(tool => {
        const category = getToolCategory(tool.name);
        return options.categories!.includes(category);
      });
    }
    
    // Apply prefix filter
    if (options.prefix) {
      filteredTools = filteredTools.filter(tool =>
        tool.name.startsWith(options.prefix!)
      );
    }
  }
  
  // Sort tools for consistent ordering
  filteredTools.sort((a, b) => a.name.localeCompare(b.name));
  
  // Apply pagination
  const maxTools = options.maxTools || 50; // Default to 50 tools per page
  let startIndex = 0;
  
  if (options.cursor) {
    // Simple cursor implementation: encode the start index
    try {
      startIndex = parseInt(Buffer.from(options.cursor, 'base64').toString('utf8'), 10);
    } catch {
      startIndex = 0;
    }
  }
  
  const paginatedTools = filteredTools.slice(startIndex, startIndex + maxTools);
  const hasMore = startIndex + maxTools < filteredTools.length;
  
  return {
    tools: paginatedTools,
    nextCursor: hasMore 
      ? Buffer.from((startIndex + maxTools).toString()).toString('base64')
      : undefined,
    totalCount: filteredTools.length
  };
}

/**
 * Get all available tool categories
 */
export function getToolCategories(tools: Tool[]): string[] {
  const categories = new Set<string>();
  tools.forEach(tool => {
    categories.add(getToolCategory(tool.name));
  });
  return Array.from(categories).sort();
}

/**
 * Group tools by category
 */
export function groupToolsByCategory(tools: Tool[]): Record<string, Tool[]> {
  const grouped: Record<string, Tool[]> = {};
  
  tools.forEach(tool => {
    const category = getToolCategory(tool.name);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(tool);
  });
  
  // Sort tools within each category
  Object.keys(grouped).forEach(category => {
    grouped[category].sort((a, b) => a.name.localeCompare(b.name));
  });
  
  return grouped;
}

/**
 * Get tool count by category
 */
export function getToolCountByCategory(tools: Tool[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  tools.forEach(tool => {
    const category = getToolCategory(tool.name);
    counts[category] = (counts[category] || 0) + 1;
  });
  
  return counts;
}