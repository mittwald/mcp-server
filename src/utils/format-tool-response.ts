import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export interface ToolResponse<T = any> {
  status: "success" | "error";
  message: string;
  data?: T;
}

export function formatToolResponse<T>(
  status: "success" | "error",
  message: string,
  data?: T,
): CallToolResult {
  const response: ToolResponse<T> = {
    status,
    message,
    ...(data && { data }),
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