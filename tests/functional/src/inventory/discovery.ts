/**
 * Discovery - MCP Tool Discovery (T035, T036)
 *
 * Connects to MCP server and lists available tools.
 */

import type { DiscoveredTool, DiscoveryOptions } from '../types/index.js';

/**
 * Tools to exclude from inventory (security/multi-tenancy)
 */
const EXCLUDED_TOOLS = [
  'mcp__mittwald__mittwald_login_reset',
  'mcp__mittwald__mittwald_login_token',
];

/**
 * MCP JSON-RPC request structure
 */
interface McpRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

/**
 * MCP JSON-RPC response structure
 */
interface McpResponse {
  jsonrpc: '2.0';
  id: number;
  result?: {
    tools?: Array<{
      name: string;
      description?: string;
      inputSchema?: unknown;
    }>;
  };
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Parse MCP tool name to display format
 * mcp__mittwald__mittwald_project_create → project/create
 */
export function parseToolName(mcpName: string): string {
  // Remove mcp__mittwald__ prefix
  const withoutPrefix = mcpName.replace(/^mcp__mittwald__mittwald_/, '');

  // Replace underscores with slashes for category/action format
  // Handle patterns like: project_create → project/create
  // database_mysql_create → database/mysql/create
  const parts = withoutPrefix.split('_');

  if (parts.length === 1) {
    return parts[0];
  }

  // First part is category, rest are action path
  return parts.join('/');
}

/**
 * Check if tool should be excluded
 */
export function isExcludedTool(name: string): boolean {
  return EXCLUDED_TOOLS.includes(name);
}

/**
 * Discover tools from MCP server (T035)
 *
 * @param options Discovery options including server URL
 * @returns Array of discovered tools
 */
export async function discover(options: DiscoveryOptions): Promise<DiscoveredTool[]> {
  const { serverUrl, timeoutMs = 30000 } = options;

  // Build JSON-RPC request for tools/list
  const request: McpRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {},
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`MCP server returned ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as McpResponse;

    if (data.error) {
      throw new Error(`MCP error ${data.error.code}: ${data.error.message}`);
    }

    if (!data.result?.tools) {
      throw new Error('No tools array in MCP response');
    }

    // Filter and transform tools (T036)
    const tools: DiscoveredTool[] = [];

    for (const rawTool of data.result.tools) {
      // Skip excluded tools
      if (isExcludedTool(rawTool.name)) {
        continue;
      }

      tools.push({
        name: rawTool.name,
        description: rawTool.description || '',
        inputSchema: rawTool.inputSchema || {},
      });
    }

    return tools;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Discovery timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

/**
 * Get display name for a tool
 */
export function getDisplayName(mcpName: string): string {
  return parseToolName(mcpName);
}

/**
 * Default MCP server URL
 */
export const DEFAULT_MCP_SERVER_URL = 'https://mittwald-mcp-fly2.fly.dev/mcp';
