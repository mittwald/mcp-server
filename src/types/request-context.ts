/**
 * @file Request context types for MCP handlers
 * @module types/request-context
 * 
 * @remarks
 * This module defines the context types passed to MCP handler functions.
 * These types ensure type safety for authentication data and session
 * information throughout the request lifecycle.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/server/authentication | MCP Authentication}
 */

import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Implementation, RequestId } from "@modelcontextprotocol/sdk/types.js";

/**
 * Context passed from MCP server to tool handler functions.
 * 
 * @remarks
 * This context provides all necessary information for handlers to:
 * - Access authentication credentials
 * - Track session state
 * - Access user-specific data
 * 
 * @example
 * ```typescript
 * export async function handleTool(
 *   args: ToolArgs,
 *   context: MCPToolContext
 * ): Promise<ToolResult> {
 *   const { sessionId, authInfo } = context;
 *   // Use context for tool operations
 * }
 * ```
 */
export interface MCPToolContext {
  /**
   * Unique session identifier for the current MCP connection.
   * Used to track per-session state and route notifications.
   */
  sessionId: string;
  
  /**
   * Authentication information for the current session.
   * Can be extended with provider-specific credentials.
   */
  authInfo: AuthInfo;

  /**
   * Abort signal used to cancel tool execution when the client disconnects.
   */
  abortSignal?: AbortSignal;

  /**
   * Server instance of the session, for server-to-client requests (e.g. elicitation).
   */
  server?: Server;

  /**
   * ID of the tools/call request. Server-to-client requests (e.g. elicitation)
   * must reference it to be sent on the response stream of this call.
   */
  requestId?: RequestId;

  clientInfo?: Implementation;
}
