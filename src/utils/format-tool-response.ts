import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export interface ToolResponse<T = any, M = any> {
  status: "success" | "error";
  message: string;
  data?: T;
  meta?: M;
}

export function formatToolResponse<T, M = any>(
  status: "success" | "error",
  message: string,
  data?: T,
  meta?: M,
): CallToolResult {
  const response: ToolResponse<T, M> = {
    status,
    message,
    ...(data && { data }),
    ...(meta !== undefined && { meta }),
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(response, null, 2),
      },
    ],
  };
}
