import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Context passed to individual tool handlers
 * 
 * @remarks
 * This minimal context is used for utility tools that don't require
 * external service connections.
 */
export interface ToolHandlerContext {
  /** Placeholder for service, not used by utility tools */
  redditService: any;
  /** User identifier */
  userId: string;
  /** Optional session identifier */
  sessionId?: string;
  /** Optional progress token for long-running operations */
  progressToken?: string | number;
}

/**
 * Generic tool handler function type
 */
export type ToolHandler<T = any> = (
  args: T,
  context: ToolHandlerContext,
) => Promise<CallToolResult>;

/**
 * Standard response type for all tool handlers
 */
export interface ToolResponse<T = any> {
  status: "success" | "error";
  message: string;
  result?: T;
  error?: {
    type: string;
    details?: any;
  };
}

/**
 * Helper function to format tool responses
 */
export function formatToolResponse<T>(
  response: Partial<ToolResponse<T>> & Pick<ToolResponse<T>, "message">,
): CallToolResult {
  const standardResponse: ToolResponse<T> = {
    status: response.status || "success",
    message: response.message,
    ...(response.result && { result: response.result }),
    ...(response.error && { error: response.error }),
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(standardResponse, null, 2),
      },
    ],
  };
}